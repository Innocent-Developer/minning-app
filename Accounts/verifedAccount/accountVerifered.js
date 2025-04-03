const AccountCreate = require('../../SchemaDb/accountCreate.js');
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const accountVerified = async (req, res) => {
    try {
        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find user first to check verification status
        const user = await AccountCreate.findById(_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is already verified
        if (user.kycStatuys === "verifed") {
            return res.status(400).json({
                success: false,
                message: 'Account is already verified'
            });
        }

        // Find and update user's KYC status
        const updatedUser = await AccountCreate.findByIdAndUpdate(
            _id,
            { kycStatuys: "verifed" },
            { new: true }
        );

        // Send verification email
        const mailOptions = {
            from: `"AUS Networks" <${process.env.EMAIL_USER}>`,
            to: [updatedUser.email, "abubakkarsajid4@gmail.com"],
            subject: "Account Verification Successful!",
            html: `
                <div style="
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 25px; 
                    font-family: 'Poppins', Arial, sans-serif; 
                    background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); 
                    color: #00ff00; 
                    border-radius: 12px; 
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                    text-align: center;">
                    
                    <h2 style="color: #ff0000; font-size: 26px; margin-bottom: 15px;">
                        Congratulations ${updatedUser.Fullname}! 🎉
                    </h2>

                    <div style="
                        background: rgba(255, 255, 255, 0.15); 
                        padding: 20px; 
                        border-radius: 10px; 
                        backdrop-filter: blur(10px);
                        box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);">
                        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 10px; color: #00ffff;">
                            Your account has been successfully verified! 🌟
                        </p>
                        <p style="font-size: 16px; line-height: 1.6; color: #00ffff;">
                            You now have full access to all features of our Mining App.
                            Start mining and earning today! ⛏️. And you Can Now send Coin for other Users.
                        </p>
                    </div>

                    <div style="margin-top: 30px;">
                        <p style="color: #ff0000; font-weight: bold; font-size: 18px;">
                            Happy Mining! ⛏️
                        </p>
                        <p style="font-style: italic; font-size: 14px; color: #00ffff;">
                            - The Mining App Team
                        </p>
                    </div>
                </div>
            `,
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'High'
            }
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Account verified successfully and notification email sent',
            user: updatedUser.email
        });

    } catch (error) {
        console.error('Account verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = accountVerified;
