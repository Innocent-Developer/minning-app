const AccountCreate = require('../../SchemaDb/accountCreate.js');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const recordTransaction = require('../history/all-transaction-record-store.js');
const { mongoose } = require('mongoose');
dotenv.config();

const ADMIN_EMAIL = process.env.Admin_Email;

const sendCoin = async (senderAddress, receiverAddress, amount) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Validate inputs
        if (!senderAddress || !receiverAddress || !amount) {
            throw new Error('Missing required parameters');
        }

        // Convert amount to number and validate
        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            throw new Error('Invalid transfer amount');
        }

        // Calculate gas fee
        const gasFee = transferAmount * 0.10; // 10% of transfer amount
        const totalDeduction = transferAmount + gasFee;

        // Find sender account by email or senderAddress
        const senderAccount = await AccountCreate.findOne({
            $or: [
                { email: senderAddress },
                { senderAddress: senderAddress }
            ]
        });
        const senderEmail = senderAccount.email;
        if (!senderAccount) {
            throw new Error('Sender account not found');
        }

        // Check if sender is KYC verified
        if (senderAccount.kycStatuys !== "verifed") {
            throw new Error('Sender account is not KYC verified. Please complete KYC verification to send coins.');
        }

        // Find receiver account by receiveAddress
        const receiverAccount = await AccountCreate.findOne({ receiveAddress: receiverAddress });
        if (!receiverAccount) {
            throw new Error('Receiver account not found');
        }

        // Get receiver's email
        const receiverEmail = receiverAccount.email;

        // Find admin account
        const adminAccount = await AccountCreate.findOne({ email: ADMIN_EMAIL });
        if (!adminAccount) {
            throw new Error('Admin account not found');
        }

        // Check if sender has sufficient available balance including gas fee
        const senderAvailableBalance = parseFloat(senderAccount.availableBalance) || 0;
        if (senderAvailableBalance < totalDeduction) {
            throw new Error('Insufficient available balance (including gas fee)');
        }

        // Update sender's balances (deduct transfer amount and gas fee)
        const newSenderAvailableBalance = (senderAvailableBalance - totalDeduction).toString();
        const newSenderTotalBalance = (parseFloat(senderAccount.totalBalance) - totalDeduction).toString();
        const newSenderSendCoin = (parseFloat(senderAccount.sendCoin || 0) + transferAmount).toString();

        // Update receiver's balances (only transfer amount, no gas fee)
        const receiverAvailableBalance = parseFloat(receiverAccount.availableBalance) || 0;
        const receiverTotalBalance = parseFloat(receiverAccount.totalBalance) || 0;
        const newReceiverAvailableBalance = (receiverAvailableBalance + transferAmount).toString();
        const newReceiverTotalBalance = (receiverTotalBalance + transferAmount).toString();

        // Update admin's balances (add gas fee)
        const adminAvailableBalance = parseFloat(adminAccount.availableBalance) || 0;
        const adminTotalBalance = parseFloat(adminAccount.totalBalance) || 0;
        const newAdminAvailableBalance = (adminAvailableBalance + gasFee).toString();
        const newAdminTotalBalance = (adminTotalBalance + gasFee).toString();

        let transactionStatus = false;
        let emailStatus = false;

        try {
            // Add rate limiting for receiver
            const receiverTransactionCount = await AccountCreate.countDocuments({
                email: receiverEmail,
                'transactions.timestamp': {
                    $gte: new Date(Date.now() - 120000) // Last 2 minutes
                }
            });

            if (receiverTransactionCount >= 10) { // Max 10 transactions per minute
                throw new Error('Too many transactions for this receiver. Please try again later.');
            }

            // Perform the updates in a transaction with optimistic locking
            await Promise.all([
                AccountCreate.findOneAndUpdate(
                    {
                        _id: senderAccount._id,
                        availableBalance: senderAccount.availableBalance // Optimistic lock
                    },
                    {
                        availableBalance: newSenderAvailableBalance,
                        totalBalance: newSenderTotalBalance,
                        sendCoin: newSenderSendCoin
                    },
                    { new: true }
                ),
                AccountCreate.findOneAndUpdate(
                    {
                        _id: receiverAccount._id,
                        availableBalance: receiverAccount.availableBalance // Optimistic lock
                    },
                    {
                        $push: { transactions: { timestamp: new Date() } },
                        availableBalance: newReceiverAvailableBalance,
                        totalBalance: newReceiverTotalBalance
                    },
                    { new: true }
                ),
                AccountCreate.findByIdAndUpdate(
                    adminAccount._id,
                    {
                        availableBalance: newAdminAvailableBalance,
                        totalBalance: newAdminTotalBalance
                    },
                    { new: true }
                )
            ]);
            transactionStatus = true;
        } catch (error) {
            if (error.message.includes('Too many transactions')) {
                throw error;
            }
            throw new Error('Failed to update account balances: ' + error.message);
        }

        const gasFeeString = gasFee.toString();
        // Generate unique transaction hash
        const transactionHash = require('crypto')
            .createHash('sha256')
            .update(`${senderAddress}${receiverAddress}${amount}${gasFeeString}${Date.now()}`)
            .digest('hex');

        // Record transaction with hash
        try {
            await recordTransaction(senderAddress, receiverAddress, amount, gasFeeString, transactionHash);
        } catch (error) {
            throw new Error('Failed to record transaction: ' + error.message);
        }

        try {
            // Configure nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Send email to sender
            const senderMailOptions = {
                from: process.env.EMAIL_USER,
                to: senderEmail,
                subject: '🎉 Coin Transfer Successful!',
                html: `
                    <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background-color: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #28a745; text-align: center;">Transaction Successful! 🚀</h2>
                            <div style="border-bottom: 2px solid #eee; margin: 15px 0;"></div>
                            <p style="color: #333;">Dear ${senderAccount.Fullname || 'Valued User'},</p>
                            <h4 style="color: #666;">You have successfully sent:</p>
                            <h3 style="text-align: center; color: #007bff; font-size: 24px;">${transferAmount} Coins</h3>
                            <p style="color: #666;">To: ${receiverAddress}</p>
                            <p style="color: #666;">Gas Fee (10%): ${gasFee} Coins</p>
                            <p style="color: #666;">Total Deducted: ${totalDeduction} Coins</p>
                            <p style="color: #666;">Transaction Time: ${new Date().toLocaleString()}</p>
                            <p style="color: #666;">New Available Balance: ${newSenderAvailableBalance}</p>
                            <a href="http://localhost:5000/get-transaction/${transactionHash}" style="color: #666;">Transaction Hash: ${transactionHash}</a>
                            <div style="text-align: center; margin-top: 20px;">
                                <p style="color: #888; font-size: 12px;">Thank you for using our service!</p>
                            </div>
                        </div>
                    </div>
                `
            };

            // Send email to receiver
            const receiverMailOptions = {
                from: process.env.EMAIL_USER,
                to: receiverEmail,
                subject: '🎁 You Received Coins!',
                html: `
                    <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background-color: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #28a745; text-align: center;">Coins Received! 🎉</h2>
                            <div style="border-bottom: 2px solid #eee; margin: 15px 0;"></div>
                            <p style="color: #333;">Dear ${receiverAccount.Fullname || 'Valued User'},</p>
                            <p style="color: #666;">You have received:</p>
                            <h3 style="text-align: center; color: #007bff; font-size: 24px;">${transferAmount} Coins</h3>
                            <p style="color: #666;">From: ${senderAddress}</p>
                            <p style="color: #666;">Transaction Time: ${new Date().toLocaleString()}</p>
                            <p style="color: #666;">New Available Balance: ${newReceiverAvailableBalance}</p>
                            <a href="http://localhost:5000/get-transaction/${transactionHash}" style="color: #666;">Transaction Hash: ${transactionHash}</a>
                            <div style="text-align: center; margin-top: 20px;">
                                <p style="color: #888; font-size: 12px;">Thank you for using our service!</p>
                            </div>
                        </div>
                    </div>
                `
            };

            // Send both emails
            await Promise.all([
                transporter.sendMail(senderMailOptions),
                transporter.sendMail(receiverMailOptions)
            ]);
            emailStatus = true;
        } catch (error) {
            throw new Error('Failed to send email notifications: ' + error.message);
        }

        if (!transactionStatus || !emailStatus) {
            throw new Error('Transaction or email notification failed');
        }

        return {
            success: true,
            message: 'Transfer completed successfully and notifications sent',
            transferDetails: {
                amount: transferAmount,
                gasFee: gasFee,
                totalDeducted: totalDeduction,
                sender: senderAddress,
                receiver: receiverAddress,
                transactionHash: transactionHash,
                timestamp: new Date()
            }
        };

    } catch (error) {
        console.error('Transfer error:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    }
};

module.exports = sendCoin;
