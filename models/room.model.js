const mongoose = require('mongoose');

var roomSchema = new mongoose.Schema({
    name: String,
    _id_message: {
        type: mongoose.Schema.Types.ObjectId, ref: 'chat'
    }
});

mongoose.model('room', roomSchema);