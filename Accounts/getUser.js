
const AccountCreate = require('../SchemaDb/accountCreate.js'); // Adjust the path as necessary


// Route to get user information by post _id
const getUserInfo = async (req, res) => {
    const { _id } = req.body; // Expecting userId in the request body

    if (!_id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const user = await AccountCreate.findById(_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userInfo = {
            name: user.Fullname,
            sendingAddress: user.senderAddress,
            receivingAddress: user.receiveAddress,
            totalBalance: user.totalBalance,
            availableBalance: user.availableBalance
        };

        return res.status(200).json(userInfo);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching user information' });
    }
};

 module.exports = getUserInfo;
