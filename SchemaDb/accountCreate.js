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
        default: () => Math.floor(10000 + Math.random() * 90000).toString() 
    },
    referallcode: { type: String, required: false },
    totalBalance: { type: String, required: false, default: "0" },
    availableBalance: { type: String, required: false, default: "0" },
    sendCoin: { type: String, required: false, default: "0" },
    receiveAddress: { type: String },
    senderAddress: { type: String },
    kycStatuys: { type: String, required: false, default: "un-verifed" },
    totalReferal: { type: String, default: "0" },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    lastMined: { type: Date, required: false },

    // 👇 New stakings array
    stakings: [
        {
            amount: Number,
            duration: Number,
            durationType: { type: String, enum: ['month', 'year'] },
            rewardAmount: Number,
            stakedAt: { type: Date },
            maturityDate: { type: Date },
            status: { type: String, enum: ['active', 'completed'], default: 'active' }
        }
    ]
});

// Pre-save hook to generate unique receiving and sender addresses
accountCreateSchema.pre('save', function(next) {
    if (!this.receiveAddress) {
        const uniqueString = crypto.randomBytes(16).toString('hex');
        this.receiveAddress = `MN${uniqueString}`;
    }
    if (!this.senderAddress) {
        const uniqueString = crypto.randomBytes(16).toString('hex');
        this.senderAddress = `MN${uniqueString}`;
    }
    next();
});

const AccountCreate = mongoose.model('AccountCreate', accountCreateSchema);
module.exports = AccountCreate;
