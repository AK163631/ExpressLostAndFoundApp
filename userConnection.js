const {User} = require("./model/user")

class UserConnection {
    constructor(email, password) {
        this.email = email
        this.password = password
        // check if user exists
        User.findOne({"email": email}, (err, user) => {
            this.vaild = this.validatePassword(user)
            if (this.vaild) {
                this.session = UserConnection.makeid(10)
            }
        })
    }

    validatePassword(user) {
        return user.comparePassword(this.password, (err, isMatch) => {
            if (err) throw err // TODO needs cleaning up
            return isMatch
        })

    }

    static registerUser(email, password) {
        new User({
            email: email,
            password: password,
            accessLevel: 1 // default to registered user
        }).save((err, response) => {
            if (err) throw err // needs cleaning up
            return new UserConnection(email, password)
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