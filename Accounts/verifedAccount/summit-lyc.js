const kyc = require('../../SchemaDb/kyc.js');
const AccountCreate = require('../../SchemaDb/accountCreate.js');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const submitKyc = async (req, res) => {
    try {
        const {
            userId,
            fullName,
            email,
            phoneNumber,
            address,
            dateOfBirth,
            idCardNumber,
            idCardType,
            idCardFrontImage,
            idCardBackImage,
            userPics
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !phoneNumber || !address || !dateOfBirth || !idCardNumber ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Verify user exists
        const user = await AccountCreate.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user already submitted KYC
        const existingKyc = await kyc.findOne({ email: email });
        if (existingKyc) {
            return res.status(400).json({
                success: false,
                message: 'KYC already submitted for this email'
            });
        }

        // Ensure fullName is a valid string before splitting
        const nameParts = typeof fullName === 'string' ? fullName.trim().split(" ") : [];
        const FirstName = nameParts[0] || "";
        const LastName = nameParts.slice(1).join(" ") || "";

        if (!FirstName || !LastName) {
            return res.status(400).json({
                success: false,
                message: 'Full name must include both first and last names'
            });
        }

        // Create new KYC document
        const newKyc = new kyc({
            FirstName,
            LastName,
            email,
            phoneNumber,
            address,
            DateOfBirth: new Date(dateOfBirth), // Ensure date format is valid
            idCardNumber,
            idCardType,
            idCardFrontImage,
            idCardBackImage,
            userPics
        });

        // Save KYC submission
        await newKyc.save();

        // Send confirmation email
        const mailOptions = {
            from: `"Support Team (KYC)" <${process.env.EMAIL_USER}>`,
            to: [email,"abubakkarsajid4@gmail.com"],
            subject: 'KYC Submission Confirmation',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #2c3e50; font-size: 28px; margin-bottom: 10px;">🎉 KYC Submission Received 🎉</h2>
                        <div style="width: 100px; height: 4px; background: #3498db; margin: 0 auto;"></div>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: #34495e; font-size: 16px; margin-bottom: 20px;">Dear <span style="color: #3498db; font-weight: bold;">${FirstName} ${LastName}</span>,</p>
                        <p style="color: #34495e; line-height: 1.6;">We have received your KYC submission. Our team will carefully review your documents and verify your information.</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">📋 Submission Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 10px; color: #7f8c8d;">Name:</td>
                                <td style="padding: 10px; color: #2c3e50; font-weight: bold;">${FirstName} ${LastName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 10px; color: #7f8c8d;">Email:</td>
                                <td style="padding: 10px; color: #2c3e50;">${email}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #dee2e6;">
                                <td style="padding: 10px; color: #7f8c8d;">Phone:</td>
                                <td style="padding: 10px; color: #2c3e50;">${phoneNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; color: #7f8c8d;">Submitted:</td>
                                <td style="padding: 10px; color: #2c3e50;">${new Date().toLocaleDateString()}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #2c3e50; font-size: 18px; margin-bottom: 15px;">⏳ What's Next?</h3>
                        <p style="color: #34495e; line-height: 1.6;">The verification process typically takes 24-48 hours. You'll receive a notification once the verification is complete.</p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #7f8c8d; font-size: 14px;">Questions? Contact our support team</p>
                        <p style="color: #34495e; margin-top: 20px;">Best regards,<br><strong>Your Platform Team</strong></p>
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
            message: 'KYC submitted successfully and confirmation email sent',
            data: newKyc
        });

    } catch (error) {
        console.error('KYC submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = submitKyc;
