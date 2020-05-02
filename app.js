var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require("mongoose")
const {User} = require("./model/user")
const {Item} = require("./model/item")
const templater = require("./templates/templater")

var usersRouter = require('./routes/users');

const DB_CONNECTION_STRING = 'mongodb+srv://dbAdmin:Pass1word@course-work-dzlrh.mongodb.net/test?retryWrites=true&w=majority'
let sessions = {}

mongoose.connect(DB_CONNECTION_STRING)
    .then(() => console.log("DB Connected"))
    .catch(error => console.log(error))


var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

app.use('/users', usersRouter);
app.use(express.static(__dirname + '/webroot'))


/* GET home page. */
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/webroot/index.html');
});

app.post("/register", (req, res) => {
    User.findOne({"email": req.body.email}, (err, user) => {
        if (user) {
            res.status(400)
            res.set('Content-Type', 'text/html');
            return res.send(new Buffer(templater({"{{error}}": "User " + user.email + " already exists"}, "templates/error.html")));
        }

        if (req.body.password !== req.body.confirmPassword) {
            res.status(400)
            res.set('Content-Type', 'text/html');
            return res.send(new Buffer(templater({"{{error}}": "Passwords don't match"}, "templates/error.html")));
        }

        new User({
            email: req.body.email,
            password: req.body.password,
            accessLevel: 1 // default to registered user
        }).save((err, response) => {
            if (err) res.status(400).send(err)
            else {
                res.status(200).send(response)
            }
        })
    })

})

app.post("item/add", (req, res) => {
    new Item({
        id: makeid(10),
        description: req.body.description
    }).save((err, response) => {
        if (err) res.status(400).send(err)
        else {
            res.status(200).send(response)
        }
    })

})

app.post("/login", (req, res) => {
    User.findOne(
        {"email": req.body.email},
        (err, user) => {
            if (!user) {
                res.status(400)
                res.set('Content-Type', 'text/html');
                return res.send(new Buffer(templater({"{{error}}": "User Not Found"}, "templates/error.html")));

            } else {
                user.comparePassword(req.body.password, (err, isMatch) => {
                    if (err) throw err
                    if (!isMatch) {
                        res.status(400)
                        res.set('Content-Type', 'text/html');
                        return res.send(new Buffer(templater({"{{error}}": "Invalid Password"}, "templates/error.html")));

                    }
                    res.status(200).send("login is successful")
                })

            }
        })
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    console.log(err.message)
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.sendFile(__dirname + "/webroot/error.html");
});

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


module.exports = app;
