const Transaction = require('../../SchemaDb/all-transactionSchema');
const AccountCreate = require('../../SchemaDb/accountCreate');

const recordTransaction = async (senderAddress, receiverAddress, amount, gasFeeString,transactionHash,status = 'completed') => {
    try {
        // Create single transaction record
        const transaction = new Transaction({
            senderAddress,
            receiverAddress,
            amount,
            GassFee:gasFeeString,
            transaction_Hash: transactionHash,
            transactionType: 'Internal Transfer', // Default to send type
            status
        });

        // Save the transaction
        await transaction.save();

        return {
            success: true,
            message: 'Transaction recorded successfully'
        };

    } catch (error) {
        console.error('Error recording transaction:', error);
        throw error;
    }
};

// Export the function
module.exports = recordTransaction;
