const express = require('express');
const router = express.Router();
const AccountCreate = require('../SchemaDb/accountCreate');

router.post('/updateLastMined', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const user = await AccountCreate.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if lastMined field exists, if not, create it
        if (!user.lastMined) {
            user.lastMined = new Date();
        } else {
            user.lastMined = new Date();
        }
        
        await user.save();
        return res.status(200).json({ message: 'Last mined date updated successfully' });
    } catch (error) {
        console.error('Error updating last mined date:', error);
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

module.exports = router;
