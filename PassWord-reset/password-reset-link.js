const express = require('express');

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const AccountCreate = require('../SchemaDb/accountCreate.js');


const passwordResetLink = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await AccountCreate.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

        // Save reset token to user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Reset password email template
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `
                <div style="
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 25px;
                    font-family: 'Poppins', Arial, sans-serif;
                    background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                    text-align: center;">

                    <h2 style="color: #ffcc00; font-size: 26px; margin-bottom: 15px;">
                        Password Reset Request
                    </h2>

                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        padding: 20px;
                        border-radius: 10px;
                        backdrop-filter: blur(10px);
                        box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);">
                        <p style="font-size: 16px; line-height: 1.6;">
                            You requested a password reset. Click the button below to reset your password.
                            This link will expire in 1 hour.
                        </p>
                    </div>

                    <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" 
                        style="
                        display: inline-block;
                        margin-top: 20px;
                        padding: 12px 25px;
                        background: linear-gradient(90deg, #ffcc00, #ff9900);
                        color: #000;
                        text-decoration: none;
                        font-weight: bold;
                        border-radius: 8px;
                        box-shadow: 0 4px 10px rgba(255, 204, 0, 0.3);
                        transition: transform 0.2s ease;">
                        Reset Password
                    </a>

                    <div style="margin-top: 30px;">
                        <p style="color: #ffcc00; font-size: 14px;">
                            If you didn't request this reset, please ignore this email.
                        </p>
                    </div>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'Password reset link sent to your email',
            resetToken
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            message: 'Error sending password reset email',
            error: error.message
        });
    }
};
module.exports = passwordResetLink;
