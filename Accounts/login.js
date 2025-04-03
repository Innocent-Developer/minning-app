const AccountCreate = require('../SchemaDb/accountCreate.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await AccountCreate.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET, // Ensure you have a JWT_SECRET in your .env file
            { expiresIn: "7d" } // Token expires in 7 days
        );

        // Send response with token
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                Fullname: user.Fullname,
                email: user.email,
                password: user.password,
                phone: user.phone,
                address: user.address,
                inviteCode: user.inviteCode,
                referallcode: user.referallcode,
                totalBalance: user.totalBalance,
                availableBalance: user.availableBalance,
                sendCoin: user.sendCoin,
                receiveAddress: user.receiveAddress,
                senderAddress: user.senderAddress,
                kycStatuys: user.kycStatuys,
                totalReferal: user.totalReferal,
                resetPasswordToken: user.resetPasswordToken,
                resetPasswordExpires: user.resetPasswordExpires,
                lastMined: user.lastMined
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = login;
