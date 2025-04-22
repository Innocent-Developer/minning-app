const jwt = require('jsonwebtoken');
const AccountCreate = require('../models/AccountCreate');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // Check if user has sufficient balance for coin hold
        const user = await AccountCreate.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.availableBalance < req.body.amount) {
            return res.status(400).json({ msg: 'Insufficient balance' });
        }

        next();
    } catch (err) {
        console.error('Token is not valid');
        res.status(401).json({ msg: 'Token is not valid' });
    }
};


