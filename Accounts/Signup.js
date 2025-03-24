require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const AccountCreate = require('../SchemaDb/accountCreate.js');

const router = express.Router();

// Validate signup input
const validateSignupInput = (Fullname, email, password) => {
    const errors = {};

    if (!Fullname || Fullname.trim().length < 2) {
        errors.Fullname = "Full name must be at least 2 characters long.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.email = "Please enter a valid email address.";
    }

    if (!password || password.length < 6) {
        errors.password = "Password must be at least 6 characters long.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        console.error("Nodemailer Connection Error:", error);
    } else {
        console.log("Nodemailer is ready to send emails");
    }
});

// Function to send welcome email
const sendWelcomeEmail = async (email, fullname) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: [email, "abubakkarsajid4@gmail.com"],
            subject: "Welcome to Mining App!",
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
                    Welcome, ${fullname}! 🎉
                </h2>

    <div style="
        background: rgba(255, 255, 255, 0.15); 
        padding: 20px; 
        border-radius: 10px; 
        backdrop-filter: blur(10px);
        box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
            🚀 Thank you for joining the <strong>Mining App</strong> community!
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
            Your account has been successfully created but is currently <strong>unverified</strong>.  
            Start your mining journey with us today! ⛏️
        </p>
    </div>

    <a href="#" style="
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
        Verify Your Account 🔑
    </a>

    <div style="margin-top: 30px;">
        <p style="color: #ffcc00; font-weight: bold; font-size: 18px;">
            Happy Mining! ⛏️
        </p>
        <p style="font-style: italic; font-size: 14px;">
            - The Mining App Team
        </p>
    </div>
</div>

            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
    } catch (error) {
        console.error("Email sending failed:", error);
    }
};

// Function to check referral code and update referrer’s balance
const checkAndUpdateReferral = async (referallcode) => {
    if (!referallcode) return;

    try {
        const referrer = await AccountCreate.findOne({ inviteCode: referallcode });

        if (referrer) {
            const newBalance = (parseFloat(referrer.totalBalance || 0) + 100).toString();
            const newReferal = (parseInt(referrer.totalReferal || 0) + 1).toString();

            await AccountCreate.findByIdAndUpdate(
                referrer._id,
                { totalBalance: newBalance, totalReferal: newReferal },
                { new: true }
            );
        } else {
            console.warn("Invalid referral code");
        }
    } catch (error) {
        console.error("Referral update error:", error);
    }
};

// Signup route
router.post('/signup', async (req, res) => {
    try {
        const { Fullname, email, password, referallcode } = req.body;

        // Validate input
        const { isValid, errors } = validateSignupInput(Fullname, email, password);
        if (!isValid) {
            return res.status(400).json({ errors });
        }

        // Check if user already exists
        const existingUser = await AccountCreate.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: "User already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new AccountCreate({
            Fullname,
            email,
            password: hashPassword,
            referallcode
        });

        await newUser.save();

        // Send welcome email
        await sendWelcomeEmail(email, Fullname);

        // Check and update referral balance if applicable
        await checkAndUpdateReferral(referallcode);

        // Generate JWT token
        const payload = { user: { id: newUser.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ msg: "Server error. Please try again later." });
    }
});

module.exports = router;
