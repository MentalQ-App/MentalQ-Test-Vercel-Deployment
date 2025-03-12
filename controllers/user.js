const db = require("../models");
const { Users, Credentials, Psychologist } = db;
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

async function sendVerificationEmailUpdate(email, token) {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your New Email',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="text-align: center; background-color: #f4f4f4; padding: 20px;">
                    <h2 style="color: #555;">Email Verification</h2>
                </div>
                <div style="padding: 20px; background-color: #fff; border: 1px solid #ddd;">
                    <p>Hello,</p>
                    <p>Please verify your new email by clicking the button below:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${verificationLink}" style="
                            display: inline-block; 
                            padding: 10px 20px; 
                            background-color: #4CAF50; 
                            color: white; 
                            text-decoration: none; 
                            border-radius: 5px;
                            font-weight: bold;
                        ">Verify Email</a>
                    </div>
                    <p>This link will expire in 1 hour. If you did not update your account email, you can ignore this email.</p>
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
}

const multerStorage = multer.memoryStorage();
const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
        }
    }
});

exports.updateUser = async (req, res) => {
    const user_id = req.user_id;
    const { email, name, birthday } = req.body;
    const updateData = {};
    let t;

    try {
        t = await db.sequelize.transaction();
        const user = await Users.findOne({ where: { user_id }, include: "credentials", transaction: t });

        if (!user) {
            await t.rollback();
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        if (email && email !== user.email) {
            const existingEmail = await Users.findOne({ where: { email }, transaction: t });
            if (existingEmail) {
                await t.rollback();
                return res.status(400).json({ error: true, message: 'Email already exists' });
            }

            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            user.credentials.email = email;
            user.credentials.email_verification_token = emailVerificationToken;
            user.credentials.email_verification_expires = Date.now() + 3600000;
            user.credentials.is_email_verified = false;
            updateData.email = email;
            await user.credentials.save({ transaction: t });
            await sendVerificationEmailUpdate(email, emailVerificationToken);
        }

        if (req.file) {
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${user_id}-${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage.from('users-profile').upload(`profile-pictures/${fileName}`, req.file.buffer, {
                contentType: req.file.mimetype
            });

            if (error) throw error;
            updateData.profile_photo_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/users-profile/profile-pictures/${fileName}`;
        }

        if (name && name !== user.name) updateData.name = name;
        if (birthday && birthday !== user.birthday) updateData.birthday = birthday;
        if (Object.keys(updateData).length === 0) {
            await t.rollback();
            return res.status(200).json({ error: false, message: 'No changes to update', user });
        }

        const updatedUser = await user.update(updateData, { transaction: t });
        await t.commit();

        res.status(200).json({ error: false, message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ error: true, message: error.message });
    }
};

exports.uploadProfileImage = upload.single('profileImage');

exports.getAllUsers = async (req, res) => {
    let t;

    try {
        t = await db.sequelize.transaction();

        const users = await Users.findAll({
            attributes: ['user_id', 'email', 'name', 'birthday'],
            where: { isActive: true },
            transaction: t
        });

        await t.commit();

        res.status(200).json({
            error: false,
            message: 'Users retrieved successfully',
            users: users
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

exports.getUserById = async (req, res) => {
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const user = await Users.findOne({
            where: {
                user_id,
                isActive: true
            },
            attributes: ['user_id', 'email', 'name', 'birthday'],
            transaction: t
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }

        await t.commit();

        res.status(200).json({
            error: false,
            message: 'User retrieved successfully',
            user
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    const user_id = req.user_id;
    let t;

    try {
        t = await db.sequelize.transaction();

        const user = await Users.findOne({
            where: {
                user_id,
                isActive: true
            },
            transaction: t
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }

        await user.update({
            isActive: false
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            error: false,
            message: 'User deleted successfully'
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
};

exports.TermsOfService = async (req, res) => {
    res.render('terms-of-service')
}

exports.PrivacyPolicy = async (req, res) => {
    res.render('privacy-policy')
}