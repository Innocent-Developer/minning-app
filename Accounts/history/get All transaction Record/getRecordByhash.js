const Transaction = require('../../../SchemaDb/all-transactionSchema');

const HashRecord = async (req, res) => {
    try {
        const { transaction_Hash } = req.params;
        const transaction = await Transaction.findOne({ transaction_Hash });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        return res.status(200).json({
            success: true,
            transaction
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

module.exports = HashRecord;
