const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const CoinHold = require('../models/CoinHold');

// Route to stack coins
router.post('/stack', [
    auth,
    [
        check('amount', 'Amount is required').not().isEmpty(),
        check('duration', 'Duration is required').isIn([1, 3, 6, 12])
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { amount, duration } = req.body;

    try {
        const user = req.user.id;

        // Calculate return amount based on duration
        let returnAmount;
        switch (duration) {
            case 1:
                returnAmount = amount * 1.12;
                break;
            case 3:
                returnAmount = amount * 1.36; // Assuming 12% per month
                break;
            case 6:
                returnAmount = amount * 1.72; // Assuming 12% per month
                break;
            case 12:
                returnAmount = amount * 2.44; // Assuming 12% per month
                break;
            default:
                return res.status(400).json({ msg: 'Invalid duration' });
        }

        // Create new coin hold entry
        const newCoinHold = new CoinHold({
            user,
            amount,
            duration,
            returnAmount
        });

        await newCoinHold.save();

        res.json(newCoinHold);
    } catch (error) {
        console.error("Coin stacking error:", error);
        res.status(500).json({ msg: "Server error. Please try again later." });
    }
});

module.exports = router;

/*
How to Run This File:

1. Ensure you have Node.js installed on your system. You can download it from https://nodejs.org/.

2. Set up your environment variables, particularly 'JWT_SECRET', which is required for token verification.

3. Install the necessary dependencies by running the following command in your terminal:
   npm install express express-validator jsonwebtoken mongoose

4. Make sure your MongoDB server is running, as this file interacts with a MongoDB database.

5. To start the server, create an Express application and use this router. For example, in your main server file (e.g., app.js), include the following:

   const express = require('express');
   const app = express();
   const coinHoldRouter = require('./path/to/this/file');

   app.use(express.json());
   app.use('/api/coin-hold', coinHoldRouter);

   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

6. You can now send POST requests to the '/api/coin-hold/stack' endpoint with the required 'amount' and 'duration' fields in the request body, along with a valid JWT token in the 'x-auth-token' header.
*/
