const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    senderAddress: {
        type: String,
        required: true
    },
    receiverAddress: {
        type: String, 
        required: true
    },
    amount: {
        type: String,
        required: true
    },
    GassFee: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['completed', 'failed', 'pending'],
        default: 'completed'
    },
    transaction_Hash:{
        type:String,
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
