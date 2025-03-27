
const Email = require('../SchemaDb/storeEmailMarketing'); // Adjust the path as necessary

// Route to store email
const storeEmail = async (req, res) => {
    const { emailAddress } = req.body;

    if (!emailAddress) {
        return res.status(400).json({ error: 'Email address is required' });
    }

    try {
        const newEmail = new Email({ emailAddress });
        await newEmail.save();
        return res.status(201).json({ message: 'Email stored successfully', email: newEmail });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while storing the email' });
    }
};

module.exports = storeEmail;
