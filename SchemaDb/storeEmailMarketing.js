const mongoose = require('mongoose');
const { Schema } = mongoose;

const emailSchema = new Schema({
    emailAddress: {
        type: String,
        required: true,
        unique: true,
        match: /.+\@.+\..+/ // Basic email format validation
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Email = mongoose.model('Email', emailSchema);
module.exports = Email;
