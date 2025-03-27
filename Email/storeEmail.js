
const Email = require('../SchemaDb/storeEmailMarketing'); 


const storeEmail = async (req, res) => {
    const { emailAddress } = req.body;

    if (!emailAddress) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    try {
        const newEmail = new Email({ emailAddress });
        await newEmail.save();
        return res.status(201).json({ message: ' successfully Subscribe to our newsletter for the latest updates.', email: newEmail });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while storing the email' });
    }
};

module.exports = storeEmail;
