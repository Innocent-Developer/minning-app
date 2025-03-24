const AccountCreate = require('../SchemaDb/accountCreate.js');

const addReferralBonus = async (req, res) => {
    try {
        const { _id } = req.body;
        
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find user by ID
        const user = await AccountCreate.findById(_id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate bonus based on total referrals - 0.001 per referral
        const totalReferrals = parseInt(user.totalReferal) || 0;
        const bonusAmount = totalReferrals * 0.001;

        // Add 10 coins plus bonus to current user's balance
        const currentBalance = parseFloat(user.totalBalance) || 0;
        const newBalance = currentBalance + parseFloat(process.env.Mining_coin) + bonusAmount;

        await AccountCreate.findByIdAndUpdate(
            _id,
            { totalBalance: newBalance.toString() },
            { new: true }
        );  

        // Get referral code of current user
        const referralCode = user.referallcode;

        if (referralCode) {
            // Find referrer using the referral code
            const referrer = await AccountCreate.findOne({ inviteCode: referralCode });

            if (referrer) {
                // Add 10 coins to referrer's balance
                const referrerCurrentBalance = parseFloat(referrer.totalBalance) || 0;
                const referrerNewBalance = referrerCurrentBalance + (10 * 0.10);

                // Update referrer's balance
                await AccountCreate.findByIdAndUpdate(
                    referrer._id,
                    { totalBalance: referrerNewBalance.toString() },
                    { new: true }
                );

                return res.status(200).json({
                    success: true,
                    message: 'Mining rewards added to both user and referrer',
                    userBalance: newBalance,
                    referrerBonus: bonusAmount,
                    referrerBalance: referrerNewBalance
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Mining reward added successfully',
            userBalance: newBalance,
            bonusAmount: bonusAmount
        });

    } catch (error) {
        console.error('Mining reward error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = addReferralBonus;
