const UserConnection = require("./utils/userConnection")
const TemplatingEngine = require("./utils/templatingEngine")
const RegisteredItem = require("./utils/registeredItem")
const {Item} = require("./model/item")

const fileUpload = require('express-fileupload');
const fs = require('fs')

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require("mongoose")

var usersRouter = require('./routes/users');

const DB_CONNECTION_STRING = 'mongodb+srv://dbAdmin:Pass1word@course-work-dzlrh.mongodb.net/test?retryWrites=true&w=majority'
let sessions = {} // {id: user}

let items = function () {
    Item.find({}, function (err, allItems) {
        let items_ = {}
        if (err) throw err
        // loop through db objects
        for (let item in allItems) {
            let itemOBJ = new RegisteredItem(item.category, item.timeFound, item.location, item.description, null)
            if (fs.existsSync(itemOBJ.filePath)) {
                items_[itemOBJ.id] = itemOBJ
            } else {
                Item.deleteOne(item, () => {
                    if (err) console.log(err);
                })
            }
        }
        fs.readdir(__dirname + "/webroot/static/images", function (err, files) {
            if (err) throw err
            files.forEach(function (file, index) {
                if (!path.basename(file).split(".jpg").pop() in items_) {
                    // file id not in database
                    fs.unlinkSync(file)
                }
            })
        })
        return items
    })
    // TODO load items from database
}() // {id: item}
let requests = {} // item : user
console.log(items)
mongoose.connect(DB_CONNECTION_STRING)
    .then(() => console.log("DB Connected"))
    .catch(error => console.log(error))


var app = express();

app.use(fileUpload());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/users', usersRouter);
app.use(express.static(__dirname + '/webroot'))

/* serve home page */
app.get('/', function (req, res) {
    let user = hasActiveSession(req)
    if (user) {
        // has a user session
        sendPage(res, user.templatingEngine.generateIndexPage(items))
    } else {
        sendPage(res, TemplatingEngine.generateIndexPage(items))
    }
});


app.post("/register", (req, res) => {
    if (req.body.password !== req.body.confirmPassword) {
        return sendError(res, "Passwords Do Not Match")
    }
    UserConnection.registerUser(req.body.email, req.body.password, (isError, errorString) => {
        if (isError) {
            return sendError(res, errorString)
        }
        sendError(res, "Success user " + req.body.email + " added") // TODO correcting

    })
})

/* Serve register page*/
app.get("/register", (req, res) => {
    if (hasActiveSession(req)) {
        res.status(200).redirect("/") // if has active session
    } else {
        res.status(200).sendFile(__dirname + "/webroot/static-register.html");
    }
});


app.post("/login", async (req, res) => {
    let connection = new UserConnection(req.body.email, req.body.password)
    connection.checkValid((valid) => {
        if (valid) {
            // add connection to cookie store
            sessions[connection.session] = connection
            //set cookie and redirect them to home page
            res.cookie("session", connection.session).redirect("/")
        } else {
            sendError(res, connection.error)
        }
    })

});

app.get("/login", (req, res) => {
    if (hasActiveSession(req)) {
        res.status(200).redirect("/") // if has active session
    } else {
        res.status(200).sendFile(__dirname + "/webroot/static-login.html");
    }
});

app.get("/logout", (req, res) => {
    if (hasActiveSession(req)) {
        delete sessions[req.cookies.session]
    }
    res.status(200).redirect("/") // redirect to home
});


app.get("/item/:itemid", (req, res) => {
    let user = hasActiveSession(req)
    if (user) {
        let id = req.params.itemid
        if (id) {
            if (id in items) {
                return sendPage(res, user.templatingEngine.generateItemPage(items[id]))
            }
        }
    }
    res.status(200).redirect("/")

});

app.post("/item:itemid", (req, res) => {
    let user = hasActiveSession(req)
    if (user) {
        let id = req.params.itemid
        if (id) {
            if (id in items) {
                if (items[id] in requests) {
                    return sendError(res, "Item already Requested")
                }
                requests[items[id]] = user
                // change to info send
                return sendError(res, "Item successfully Requested")
            }
        }
        return sendError(res, "Unable To find Item Page")
    }
    res.status(200).redirect("/")
});


app.get("/add-item", (req, res) => {
    let user = hasActiveSession(req)
    if (user) {
        return sendPage(res, user.templatingEngine.generateAddItemPage())
    }
    // ignore the request
    res.status(200).redirect("/")
});

app.post("/add-item", (req, res) => {
    if (!hasActiveSession(req)) {
        return res.status(200).redirect("/")
    }
    if (!req.files || Object.keys(req.files).length === 0) {
        return sendError(res, "No File Attached");
    }
    let item = new RegisteredItem(req.body.category,
        req.body.timefound,
        req.body.location,
        req.body.description,
        req.files.imgFile,
        UserConnection.makeid(10))
    item.registerItem((isError) => {
        if (isError) {
            return sendError(res, "Unable to add item")
        }
        items[item.id] = item // add item to local cache
        res.status(200).redirect("/")
    })
});


app.get("/request-list", (req, res) => {
    let user = hasActiveSession(req)
    if (user) {
        // privilege check done internally
        return sendPage(res, user.templatingEngine.generateRequestListPage())
    }
    // ignore the request
    res.status(200).redirect("/")
})

app.post("/approve-request/:confirmRequest/:itemid", (req, res) => {
    let user = hasActiveSession(req)
    if (user) {
        if (user.accessLevel === 0) {
            let confirmRequest = req.params.confirmRequest
            let itemid = req.params.itemid
            if (confirmRequest && itemid) {
                let item = items[itemid]
                let requestingUser = requests[item]
                if (confirmRequest === "true") {
                    // remove items
                    item.selfDelete()
                    delete requests[item]
                    delete items[item]
                } else if (confirmRequest === "false") {
                    // deny the request
                    delete requests[item]
                }
                return res.status(200).redirect("/request-list")
            }
        }
    }
    res.status(200).redirect("/")
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});


// error handler
// app.use(function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     console.log(err.message)
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//     // render the error page
//     res.status(err.status || 500);
//     res.sendFile(__dirname + "/webroot/static-error.html");
// });

function sendPage(res, buffer) {
    res.status(200)
    res.set('Content-Type', 'text/html');
    return res.send(buffer)
}

function sendError(res, errorString) {
    res.status(400)
    res.set('Content-Type', 'text/html');
    return res.send(TemplatingEngine.generateError(errorString));
}

function getUser(sessionCookie) {
    return sessions[sessionCookie]
}

function hasActiveSession(req) {
    let sessionCookie = req.cookies.session
    let user = getUser(sessionCookie)// type: UserConnection
    // either session cookie is not found or user is not found
    if (![user, sessionCookie].includes(undefined)) {
        return user
    }
    return false
}


module.exports = app;
