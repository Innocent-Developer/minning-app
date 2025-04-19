
const AccountCreate = require('../../SchemaDb/accountCreate');

const getReferralList = async (req, res) => {
    try {
        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({ message: 'Invite code is required' });
        }

        // Find all users with matching referral code
        const referredUsers = await AccountCreate.find({ referallcode: inviteCode });

        if (!referredUsers.length) {
            return res.status(404).json({ message: 'No users found with this referral code' });
        }

        res.status(200).json({
            message: 'Referred users retrieved successfully',
            count: referredUsers.length,
            users: referredUsers
        });

    } catch (error) {
        res.status(500).json({ 
            message: 'An error occurred while fetching referral list',
            error: error.message 
        });
    }
};

module.exports = getReferralList;
