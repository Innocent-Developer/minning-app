const Transaction = require('../../SchemaDb/all-transactionSchema'); // Adjust the path as necessary

// Route to get all transactions by receivingAddress
const getUserTransactions = async (req, res) => {
    const { address } = req.body; // Expecting one address to check both sender and receiver

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    try {
        const transactions = await Transaction.find({
            receiverAddress: address // Fixed the syntax error here
        }).sort({ timestamp: -1 }); // Sort by timestamp in descending order to show latest transactions first

        return res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching transactions' });
    }
};

module.exports = getUserTransactions;
