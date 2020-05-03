const {User} = require("../model/user")
const TemplatingEngine = require("../utils/templatingEngine")

module.exports = class UserConnection {
    constructor(email, password) {
        this.email = email
        this.password = password
        this.user = undefined
    }

    checkValid(callback) {
        UserConnection.findUser(this.email, (err, user) => {
                let valid = false
                if (user) {
                    this.user = user
                    user.comparePassword(this.password, (isMatch) => {
                        if (isMatch) {
                            valid = true
                            this.session = UserConnection.makeid(20)
                            this.templatingEngine = new TemplatingEngine(this.email, user.accessLevel)
                        } else {
                            this.error = "Invalid Password"
                        }
                        callback(valid)
                    })
                } else {
                    this.error = "Invalid User Name"
                    callback(valid)
                }

            }
        )

    }

    static findUser(email, callback) {
        User.findOne({email: email}, callback)
    }


    static registerUser(email, password, callback) {
        UserConnection.findUser(email, (err, user) => {
            if (user) {
                callback(true, "User Already Exists")
            } else {
                new User({
                    email: email,
                    password: password,
                    accessLevel: 1 // default to registered user
                }).save((err, response) => {
                    if (err) throw err // needs cleaning up
                    callback(false)
                })
            }

        })

    }

    static makeid(length) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
;