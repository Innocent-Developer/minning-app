const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const accountCreateSchema = new Schema({
    Fullname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }, 
    phone: { type: String, required: false },
    address: { type: String, required: false },
    inviteCode: {
        type: String,
        required: false,
        default: () => Math.floor(10000 + Math.random() * 90000).toString() // Generates random 5 digit number
    },
    referallcode: { type: String, required: false },
    totalBalance: { type: String, required: false, default: "0" },
    availableBalance: { type: String, require: false, default: "0" },
    sendCoin: { type: String, required: false, default: "0" },
    receiveAddress: { type: String, },
    senderAddress: { type: String, },
    kycStatuys: { type: String, require: false, default: "un-verifed" },
    totalReferal: { type: String, default: "0" },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    lastMined: { type: Date, required: false }
    

});

// Pre-save hook to generate unique receiving and sender addresses
accountCreateSchema.pre('save', function(next) {
    if (!this.receiveAddress) {
        // Generate a unique 32 character address using crypto
        const uniqueString = crypto.randomBytes(16).toString('hex');
        this.receiveAddress = `MN${uniqueString}`; // Prefix with MN for Mining Network
    }
    if (!this.senderAddress) {
        // Generate a unique 32 character address using crypto
        const uniqueString = crypto.randomBytes(16).toString('hex');
        this.senderAddress = `MN${uniqueString}`; // Prefix with MN for Mining Network
    }
    next();
});

const AccountCreate = mongoose.model('AccountCreate', accountCreateSchema);
module.exports = AccountCreate;
