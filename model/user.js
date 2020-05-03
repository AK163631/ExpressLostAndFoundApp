const mongoose = require("mongoose")
const bcrypt = require("bcrypt-nodejs")
let ROUNDS = 10

const userSchema = mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5
    },

    accessLevel: {
        type: Number,
        required: true,
        maxlength: 1
    }
})

userSchema.pre('save', function (next) {
    const user = this;

    bcrypt.genSalt(ROUNDS, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});


userSchema.methods.comparePassword = function (targetPassword, callback) {
    bcrypt.compare(targetPassword, this.password, function (err, isMatch) {
        if (err) throw err // TODO deal with error
        callback(isMatch)
    })
}

const User = mongoose.model("User", userSchema);
module.exports = {User}