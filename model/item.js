const mongoose = require("mongoose")

const itemSchema = mongoose.Schema({

    id: {
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    description: {
        type: String,
        required: true
    }
})

const Item = mongoose.model("User", itemSchema);
module.exports = {Item}