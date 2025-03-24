const Transaction = require('../../../SchemaDb/all-transactionSchema');

const getAllrecord = async (req, res) => {
    try {
        // Fetch all transactions from the database, sorted by timestamp in descending order (newest first)
        const transactions = await Transaction.find()
            .sort({ timestamp: -1 });

        // If no transactions found
        if (!transactions || transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No transactions found'
            });
        }

        // Format the transactions for response
        const formattedTransactions = transactions.map(transaction => ({
            senderAddress: transaction.senderAddress,
            receiverAddress: transaction.receiverAddress,
            amount: transaction.amount,
            GasFee: transaction.GassFee,
            Transaction_Hash:transaction.transaction_Hash,
            transactionType: transaction.transactionType,
            status: transaction.status,
            timestamp: transaction.timestamp,
            date: new Date(transaction.timestamp).toLocaleString()
        }));

        return res.status(200).json({
            success: true,
            AllTransaction: transactions.length,
            transactions: formattedTransactions
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching transaction history',
            error: error.message
        });
    }
};

module.exports = getAllrecord;

