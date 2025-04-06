const mongoose = require('mongoose');
const { Schema } = mongoose;

const kycSchema = new Schema({
    FirstName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30
    },
    LastName: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: /^\+?[1-9]\d{1,14}$/
    },
    address: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100
    },
    DateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return !isNaN(Date.parse(value));
            },
            message: 'Invalid Date format'
        }
    },
    idCardNumber: {
        type: String,
        required: true
    },
    idCardType: {
        type: String,
        required: true,
        enum: ['passport', 'nationalId', 'driverLicense']
    },
    idCardFrontImage: {
        type: String,
        validate: {
            validator: function (value) {
                return value.length <= 5242880; // Limit to 5MB for base64 string
            },
            message: 'Image size exceeds 5MB'
        }
    },
    idCardBackImage: {
        type: String,
        validate: {
            validator: function (value) {
                return value.length <= 5242880; // Limit to 5MB for base64 string
            },
            message: 'Image size exceeds 5MB'
        }
    },
    userPics: {
        type: String,
        validate: {
            validator: function (value) {
                return value.length <= 5242880; // Limit to 5MB for base64 string
            },
            message: 'Image size exceeds 5MB'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Kyc = mongoose.model('Kyc', kycSchema);
module.exports = Kyc;
