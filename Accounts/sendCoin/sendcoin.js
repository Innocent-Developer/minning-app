const AccountCreate = require('../../SchemaDb/accountCreate.js');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const recordTransaction = require('../history/all-transaction-record-store.js');
const { mongoose } = require('mongoose');
const Transaction = require('../../SchemaDb/all-transactionSchema');
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
        // Check if sender is trying to send coins to their own receive address
        const senderAccountCheck = await AccountCreate.findOne({ senderAddress });

        if (!senderAccountCheck) {
            return res.status(400).json({ message: "Sender address not found!" });
        }

        const receiverAccountCheck = await AccountCreate.findOne({ receiverAddress });

        if (!receiverAccountCheck) {
            return res.status(400).json({ message: "Receiver address not found!" });
        }

        // Ensure that the sender and receiver are different users
        if (senderAccountCheck.senderAddress === receiverAccountCheck.senderAddress) {
            return res.status(400).json({ message: "Sender and receiver cannot be the same user!" });
        }



        // Convert amount to number and validate
        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            throw new Error('Invalid transfer amount');
        }

        // Check transaction count for sender today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const transactionCount = await Transaction.countDocuments({
            senderAddress: senderAddress,
            timestamp: {
                $gte: today,
                $lt: tomorrow
            },
            status: 'completed'
        });

        // Check if transaction count exceeds limit
        const DAILY_TRANSACTION_LIMIT = 5;
        if (transactionCount >= DAILY_TRANSACTION_LIMIT) {
            // Generate failed transaction hash
            const failedTransactionHash = require('crypto')
                .createHash('sha256')
                .update(`${senderAddress}${receiverAddress}${amount}${Date.now()}`)
                .digest('hex');

            // Record the failed transaction
            await recordTransaction(
                senderAddress,
                receiverAddress,
                transferAmount,
                '0',
                failedTransactionHash,
                'failed'
            );

            // Find sender account details
            const senderAccount = await AccountCreate.findOne({
                $or: [
                    { email: senderAddress },
                    { senderAddress: senderAddress },
                    { receiveAddress: senderAddress }
                ]
            });

            if (senderAccount && senderAccount.email) {
                // Configure email transport
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                // Send failure notification email
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: senderAccount.email,
                    subject: '❌ Transaction Failed - Daily Limit Exceeded',
                    html: `
                        <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
                            <div style="background-color: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                <h2 style="color: #dc3545; text-align: center;">Transaction Failed</h2>
                                <div style="border-bottom: 2px solid #eee; margin: 15px 0;"></div>
                                <p style="color: #333;">Dear ${senderAccount.Fullname || 'Valued User'},</p>
                                <p style="color: #666;">Your transaction has failed due to exceeding the daily transaction limit.</p>
                                <p style="color: #666;">Attempted transfer amount: ${transferAmount} Coins</p>
                                <p style="color: #666;">To: ${receiverAddress}</p>
                                <p style="color: #666;">Transaction Time: ${new Date().toLocaleString()}</p>
                                <p style="color: #666;">Reason: Daily transaction limit exceeded (maximum ${DAILY_TRANSACTION_LIMIT} transactions per day)</p>
                                <p style="color: #666;">Current transaction count: ${transactionCount}</p>
                                <a href="https://minning-app.onrender.com/get-transaction/${failedTransactionHash}" style="color: #666;">Transaction Hash: ${failedTransactionHash}</a>
                                <div style="text-align: center; margin-top: 20px;">
                                    <p style="color: #888; font-size: 12px;">Please try again tomorrow when your daily limit resets.</p>
                                </div>
                            </div>
                        </div>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);
                } catch (error) {
                    console.error('Failed to send failure notification email:', error);
                }
            }

            // Abort transaction and return failure response
            await session.abortTransaction();
            session.endSession();

            return {
                success: false,
                status: 'failed',
                message: `Daily transaction limit exceeded. Maximum ${DAILY_TRANSACTION_LIMIT} transactions allowed per day. Current count: ${transactionCount}`,
                transactionHash: failedTransactionHash
            };
        }

        // Calculate gas fee
        const gasFee = transferAmount * 0.10; // 10% of transfer amount
        const totalDeduction = transferAmount + gasFee;

        // Find sender account by email, senderAddress, or receiveAddress
        const senderAccount = await AccountCreate.findOne({
            $or: [
                { email: senderAddress },
                { senderAddress: senderAddress },
                { receiveAddress: senderAddress }
            ]
        }).session(session);

        if (!senderAccount) {
            await session.abortTransaction();
            return {
                success: false,
                message: 'Sender account not found',
                error: new Error('Sender account not found')
            };
        }

        const senderEmail = senderAccount.email;

        // Check if sender is KYC verified
        if (senderAccount.kycStatuys !== "verifed") {
            await session.abortTransaction();
            return {
                success: false,
                message: 'Sender account is not KYC verified. Please complete KYC verification to send coins.',
                error: new Error('KYC verification required')
            };
        }

        // Find receiver account by receiveAddress
        const receiverAccount = await AccountCreate.findOne({ receiveAddress: receiverAddress }).session(session);
        if (!receiverAccount) {
            await session.abortTransaction();
            return {
                success: false,
                message: 'Receiver account not found',
                error: new Error('Receiver account not found')
            };
        }

        // Get receiver's email
        const receiverEmail = receiverAccount.email;

        // Find admin account
        const adminAccount = await AccountCreate.findOne({ email: ADMIN_EMAIL }).session(session);
        if (!adminAccount) {
            await session.abortTransaction();
            return {
                success: false,
                message: 'Admin account not found',
                error: new Error('Admin account not found')
            };
        }

        // Check if sender has sufficient available balance including gas fee
        const senderAvailableBalance = parseFloat(senderAccount.availableBalance) || 0;
        if (senderAvailableBalance < totalDeduction) {
            // Record failed transaction due to insufficient balance
            const failedTransactionHash = require('crypto')
                .createHash('sha256')
                .update(`${senderAddress}${receiverAddress}${amount}${Date.now()}`)
                .digest('hex');

            await recordTransaction(
                senderAddress,
                receiverAddress,
                transferAmount,
                '0',
                failedTransactionHash,
                'failed'
            );

            // Send failure notification email
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: senderEmail,
                subject: '❌ Transaction Failed - Insufficient Balance',
                html: `
                    <div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="background-color: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #dc3545; text-align: center;">Transaction Failed</h2>
                            <div style="border-bottom: 2px solid #eee; margin: 15px 0;"></div>
                            <p style="color: #333;">Dear ${senderAccount.Fullname || 'Valued User'},</p>
                            <p style="color: #666;">Your transaction has failed due to insufficient balance.</p>
                            <p style="color: #666;">Attempted transfer amount: ${transferAmount} Coins</p>
                            <p style="color: #666;">Gas fee: ${gasFee} Coins</p>
                            <p style="color: #666;">Total required: ${totalDeduction} Coins</p>
                            <p style="color: #666;">Your available balance: ${senderAvailableBalance} Coins</p>
                            <p style="color: #666;">To: ${receiverAddress}</p>
                            <p style="color: #666;">Transaction Time: ${new Date().toLocaleString()}</p>
                            <a href="https://minning-app.onrender.com/get-transaction/${failedTransactionHash}" style="color: #666;">Transaction Hash: ${failedTransactionHash}</a>
                            <div style="text-align: center; margin-top: 20px;">
                                <p style="color: #888; font-size: 12px;">Please ensure sufficient balance and try again.</p>
                            </div>
                        </div>
                    </div>
                `
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (error) {
                console.error('Failed to send insufficient balance notification email:', error);
            }

            await session.abortTransaction();
            return {
                success: false,
                message: 'Insufficient available balance (including gas fee)',
                error: new Error('Insufficient balance'),
                transactionHash: failedTransactionHash
            };
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
                        sendCoin: newSenderSendCoin,
                        $push: { transactions: { timestamp: new Date() } }
                    },
                    { new: true, session }
                ),
                AccountCreate.findOneAndUpdate(
                    {
                        _id: receiverAccount._id,
                        availableBalance: receiverAccount.availableBalance // Optimistic lock
                    },
                    {
                        availableBalance: newReceiverAvailableBalance,
                        totalBalance: newReceiverTotalBalance
                    },
                    { new: true, session }
                ),
                AccountCreate.findByIdAndUpdate(
                    adminAccount._id,
                    {
                        availableBalance: newAdminAvailableBalance,
                        totalBalance: newAdminTotalBalance
                    },
                    { new: true, session }
                )
            ]);
            transactionStatus = true;
        } catch (error) {
            // Record failed transaction
            const failedTransactionHash = require('crypto')
                .createHash('sha256')
                .update(`${senderAddress}${receiverAddress}${amount}${Date.now()}`)
                .digest('hex');

            await recordTransaction(
                senderAddress,
                receiverAddress,
                transferAmount,
                '0',
                failedTransactionHash,
                'failed'
            );

            await session.abortTransaction();
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
            await recordTransaction(senderAddress, receiverAddress, amount, gasFeeString, transactionHash, 'completed');
        } catch (error) {
            await session.abortTransaction();
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

            // Verify email addresses exist before sending
            if (!senderEmail || !receiverEmail) {
                throw new Error('Missing email address for sender or receiver');
            }

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
                            <a href="https://minning-app.onrender.com/get-transaction/${transactionHash}" style="color: #666;">Transaction Hash: ${transactionHash}</a>
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
                            <a href="https://minning-app.onrender.com/get-transaction/${transactionHash}" style="color: #666;">Transaction Hash: ${transactionHash}</a>
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
            console.error('Email error:', error);
            // Continue with transaction even if email fails
            emailStatus = true; // Set to true to allow transaction to complete
        }

        if (!transactionStatus || !emailStatus) {
            // Record failed transaction
            const failedTransactionHash = require('crypto')
                .createHash('sha256')
                .update(`${senderAddress}${receiverAddress}${amount}${Date.now()}`)
                .digest('hex');

            await recordTransaction(
                senderAddress,
                receiverAddress,
                transferAmount,
                '0',
                failedTransactionHash,
                'failed'
            );

            await session.abortTransaction();
            throw new Error('Transaction or email notification failed');
        }

        await session.commitTransaction();

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
        await session.abortTransaction();
        console.error('Transfer error:', error);
        return {
            success: false,
            message: error.message,
            error: error
        };
    } finally {
        session.endSession();
    }
};

module.exports = sendCoin;
