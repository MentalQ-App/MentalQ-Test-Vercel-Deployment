const db = require('../models');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const validator = require('validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { Users, Credentials, UserSessions, PasswordResetTokens } = db;

exports.registerUser = async (req, res) => {
    const { email, password, name, birthday } = req.body;
    let t;

    try {
        if (!email || !password || !name || !birthday) {
            return res.status(400).json({ 
                error: true, 
                message: 'All fields are required' 
            });
        }

        const [day, month, year] = birthday.split('/');
        const birthdayDate = new Date(`${year}-${month}-${day}`);

        if (isNaN(birthdayDate.getTime())) {
            return res.status(400).json({ 
                error: true, 
                message: 'Invalid birthday format' 
            });
        }

        t = await db.sequelize.transaction();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newCredentials = await Credentials.create(
            { 
                email, 
                password: hashedPassword 
            },
            { transaction: t }
        );

        const newUsers = await Users.create(
            {
                credentials_id: newCredentials.credentials_id,
                email,
                name,
                birthday: birthdayDate
            },
            { transaction: t }
        );

        const token = jwt.sign(
            { user_id: newUsers.user_id }, 
            process.env.TOKEN_SECRET
        );

        await UserSessions.create(
            { 
                user_id: newUsers.user_id, 
                session_token: token 
            }, 
            { transaction: t }
        );

        await t.commit();

        const safeUser = {
            email: newUsers.email,
            name: newUsers.name,
            birthday: newUsers.birthday
        };

        res.status(201).json({
            error: false,
            message: 'User registered successfully!',
            user: safeUser,
            token: token,
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ error: true, message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    let t;

    try {
        if (!email || !password) {
            return res.status(400).json({ 
                error: true, 
                message: 'Email and password are required' 
            });
        }

        t = await db.sequelize.transaction();

        const user = await Users.findOne({
            where: { email },
            include: 'credentials',
            transaction: t,
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({ 
                error: true, 
                message: 'User not found' 
            });
        }

        const validPassword = await bcrypt.compare(password, user.credentials.password);

        if (!validPassword) {
            await t.rollback();
            return res.status(401).json({ 
                error: true, 
                message: 'Invalid password' 
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id }, 
            process.env.TOKEN_SECRET
        );

        await UserSessions.upsert(
            {
                user_id: user.user_id,
                session_token: token
            },
            { transaction: t }
        );

        await t.commit();

        const safeUser = {
            email: user.email,
            name: user.name,
            birthday: user.birthday
        };

        res.status(200).json({ 
            error: false,
            message: 'User logged in successfully',
            user: safeUser,
            token: token  
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ 
            error: true, 
            message: error.message 
        });
    }
};

exports.logoutUser = async (req, res) => {
    const authHeader = req.headers['authorization'];
    let t;

    try {
        if (!authHeader) {
            return res.status(401).json({ 
                error: true, 
                message: 'Authorization header missing' 
            });
        }

        const token = authHeader.split(' ')[1];
        t = await db.sequelize.transaction();

        const result = await UserSessions.destroy({ 
            where: { session_token: token }, 
            transaction: t 
        });

        if (result === 0) {
            await t.rollback();
            return res.status(404).json({ 
                error: true, 
                message: 'Session not found' 
            });
        }

        await t.commit();

        res.json({ 
            error: false,
            message: 'User logged out successfully' 
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ 
            error: true, 
            message: error.message 
        });
    }
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="text-align: center; background-color: #f4f4f4; padding: 20px;">
                    <h2 style="color: #555;">Password Reset Request</h2>
                </div>
                <div style="padding: 20px; background-color: #fff; border: 1px solid #ddd;">
                    <p>Hello,</p>
                    <p>Your OTP for resetting your password is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; color: #333;">${otp}</span>
                    </div>
                    <p>This OTP will expire in 15 minutes. Please use it to complete your password reset request.</p>
                    <p>If you did not make this request, you can ignore this email.</p>
                    <p>Thank you,</p>
                    <p>The Support Team</p>
                </div>
                <div style="text-align: center; background-color: #f4f4f4; padding: 10px; color: #777; font-size: 12px;">
                    <p>&copy; 2024 Your Company Name. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        error: true,
        message: 'Too many OTP requests. Please try again later.',
    },
});

exports.requestPasswordReset = [otpRequestLimiter, async (req, res) => {
    const { email } = req.body;
    let t;

    try {
        if (!email) {
            return res.status(400).json({
                error: true,
                message: 'Email is required',
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid email format',
            });
        }

        t = await db.sequelize.transaction();

        const user = await Users.findOne({
            where: { email },
            transaction: t,
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await PasswordResetTokens.upsert(
            {
                user_id: user.user_id,
                token: otp,
                expiresAt: expiresAt,
            },
            { transaction: t }
        );

        await sendOTPEmail(email, otp);

        await t.commit();

        res.json({
            error: false,
            message: 'Password reset OTP has been sent to your email',
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: error.message,
        });
    }
}];

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    let t;

    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                error: true,
                message: 'Email, OTP, and new password are required',
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid email format',
            });
        }

        if (
            newPassword.length < 8 ||
            !/[A-Z]/.test(newPassword) ||
            !/\d/.test(newPassword)
        ) {
            return res.status(400).json({
                error: true,
                message: 'Password must be at least 8 characters long, include an uppercase letter, and a number',
            });
        }

        t = await db.sequelize.transaction();

        const user = await Users.findOne({
            where: { email },
            transaction: t,
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'User not found',
            });
        }

        const resetToken = await PasswordResetTokens.findOne({
            where: {
                user_id: user.user_id,
                expiresAt: {
                    [db.Sequelize.Op.gt]: new Date(),
                },
            },
            transaction: t,
        });

        if (!resetToken || !(resetToken.token === otp)) {
            await t.rollback();
            return res.status(400).json({
                error: true,
                message: 'Invalid or expired OTP',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.credentials.update(
            { password: hashedPassword },
            { transaction: t }
        );

        await PasswordResetTokens.destroy({
            where: { user_id: user.user_id },
            transaction: t,
        });

        await t.commit();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Successful',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="text-align: center; background-color: #f4f4f4; padding: 20px;">
                        <h2 style="color: #555;">Password Reset Successful</h2>
                    </div>
                    <div style="padding: 20px; background-color: #fff; border: 1px solid #ddd;">
                        <p>Hello,</p>
                        <p>Your password has been reset successfully. If you did not perform this action, please contact support immediately.</p>
                        <p>Thank you,</p>
                        <p>The Support Team</p>
                    </div>
                    <div style="text-align: center; background-color: #f4f4f4; padding: 10px; color: #777; font-size: 12px;">
                        <p>&copy; 2024 MentalQ. All rights reserved.</p>
                    </div>
                </div>
            `,
        };
        await transporter.sendMail(mailOptions);

        res.json({
            error: false,
            message: 'Password has been reset successfully',
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: 'An error occurred while resetting the password',
        });
    }
};
