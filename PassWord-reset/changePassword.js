const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const AccountCreate = require('../SchemaDb/accountCreate.js');

const changePassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        // Find user with valid reset token that hasn't expired
        const user = await AccountCreate.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Password reset token is invalid or has expired'
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user's password and clear reset token fields
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Configure nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Password changed confirmation email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Changed Successfully',
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
                        Password Changed Successfully! 🔐
                    </h2>

                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        padding: 20px;
                        border-radius: 10px;
                        backdrop-filter: blur(10px);
                        box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);">
                        <p style="font-size: 16px; line-height: 1.6;">
                            Your password has been successfully changed. You can now log in with your new password.
                        </p>
                        <p style="font-size: 16px; line-height: 1.6;">
                            If you did not make this change, please contact our support team immediately.
                        </p>
                        <a href="mailto:abubakkarsajid4@gmail.com" style="
                            color: #ffcc00;
                            text-decoration: none;
                            font-weight: bold;
                            padding: 8px 15px;
                            background: rgba(255, 204, 0, 0.1);
                            border-radius: 5px;
                            transition: all 0.3s ease;">Support Team</a>
                    </div>

                    <div style="margin-top: 30px;">
                        <p style="color: #ffcc00; font-size: 14px;">
                            For security reasons, please make sure to keep your password confidential.
                        </p>
                    </div>
                </div>
            `
        };

        // Send confirmation email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'Password has been changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            message: 'Error changing password',
            error: error.message
        });
    }
};

module.exports = changePassword;

