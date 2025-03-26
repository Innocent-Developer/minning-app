const Transaction = require('../../SchemaDb/all-transactionSchema'); // Adjust the path as necessary

// Route to get all transactions by receivingAddress
const getUserTransactions = async (req, res) => {
    const { receiverAddress } = req.body; // Expecting receivingAddress in the request body

    if (!receiverAddress) {
        return res.status(400).json({ error: 'Receiving address is required' });
    }

    try {
        const transactions = await Transaction.find({
            $or: [
                { receiverAddress },
                { senderAddress: receiverAddress }
            ]
        });

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ error: 'No transactions found for this receiving address' });
        }

        return res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching transactions' });
    }
};

module.exports = getUserTransactions;
