const mongoose = require('mongoose')

var chatSchema = new mongoose.Schema({
    pseudo: String,
    message: String,
    created_at: {type: Date, default: Date.now}
});

mongoose.model('message', chatSchema)