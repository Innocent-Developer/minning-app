const express = require("express");
const router = express.Router();



const signup = require("../Accounts/Signup");
const login = require("../Accounts/login");
const sendCoin = require("../Accounts/sendCoin/sendcoin");
const getAllrecord = require("../Accounts/history/get All transaction Record/Record");
const HashRecord = require("../Accounts/history/get All transaction Record/getRecordByhash");
const addMiningCoin = require("../mining-coin/mining-coin");
const accountVerified = require("../Accounts/verifedAccount/accountVerifered");
const passwordResetLink = require("../PassWord-reset/password-reset-link");
const changePassword = require("../PassWord-reset/changePassword");
const submitKyc = require("../Accounts/verifedAccount/summit-lyc");
const getUserInfo = require("../Accounts/getUser"); // Assuming this is the path to the new function
const getUserTransactions = require("../Accounts/history/getUserTransaction");
const getSenderUserTransaction = require("../Accounts/history/getsenderusertransaction");
const storeEmail = require("../Email/storeEmail");
const updateLastMined = require("../Accounts/updatelastMined"); 
// Routes
router.post("/signup", signup);
router.post("/login", login);
router.post('/mining-coin', addMiningCoin);
router.post('/accountVerified', accountVerified);
router.post('/passwordResetLink', passwordResetLink);
router.post('/changePassword', changePassword);
router.post('/aaply-kyc', submitKyc);
router.get("/get-all-transaction", getAllrecord);
router.get("/get-transaction/:transaction_Hash", HashRecord);
router.post('/get-user-info', getUserInfo);
router.post('/get-user-transaction', getUserTransactions);
router.post('/get-sender-user-transaction', getSenderUserTransaction);
router.post('/store-email', storeEmail);
router.post('/update-last-mined', updateLastMined);
router.post('/send-coin', async (req, res) => {
    try {
        const { senderAddress, receiverAddress, amount } = req.body;

        // Call the sendCoin function
        const transactionResult = await sendCoin(senderAddress, receiverAddress, amount);

        res.status(200).json({
            success: true,
            transactionResult,
        });

    } catch (error) {
        console.error('Error in coin transfer:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;