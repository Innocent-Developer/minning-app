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
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send response with complete user info (excluding password)
        const {
            _id,
            Fullname,
            email: userEmail,
            phone,
            address,
            inviteCode,
            referallcode,
            totalBalance,
            availableBalance,
            sendCoin,
            receiveAddress,
            senderAddress,
            kycStatuys,
            totalReferal,
            lastMined,
            stakings
        } = user;

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                _id,
                Fullname,
                email: userEmail,
                phone,
                address,
                inviteCode,
                referallcode,
                totalBalance,
                availableBalance,
                sendCoin,
                receiveAddress,
                senderAddress,
                kycStatuys,
                totalReferal,
                lastMined,
                stakings
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = login;
