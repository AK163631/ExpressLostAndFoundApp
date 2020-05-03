const mongoose = require("mongoose")

const itemSchema = mongoose.Schema({

    id: {
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    category: {
        type: String,
    },
    timeFound: {
        type: String
    },
    location: {
        type: String
    },
    description: {
        type: String
    }


})

const Item = mongoose.model("Item", itemSchema);
module.exports = {Item}