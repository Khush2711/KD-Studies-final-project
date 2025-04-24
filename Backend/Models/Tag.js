const mongoose = require("mongoose");

const Tag = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        string: true
    },
});

module.exports = mongoose.model("Tag", Tag);