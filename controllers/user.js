const db = require('../models');
const { Users, Credentials } = db;
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { format } = require('util');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadPath = path.join(__dirname, '../uploads/profiles');
//         try {
//             if (!fs.existsSync(uploadPath)) {
//                 fs.mkdirSync(uploadPath, { recursive: true });
//             }
//         } catch (err) {
//             console.error('Error creating directory:', err);
//             return cb(new Error('Failed to create upload directory.'));
//         }
//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, `profile-${req.user_id}-${uniqueSuffix}${path.extname(file.originalname)}`);
//     }
// });

// const upload = multer({ 
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 },
//     fileFilter: (req, file, cb) => {
//         const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
//         if (allowedTypes.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
//         }
//     }
// });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
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

        const user = await Users.findOne({
            where: { 
                user_id,
            },
            include: "credentials",
            transaction: t
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }

        if (email && email !== user.email) {
            const existingEmail = await Users.findOne({
                where: { email },
                transaction: t
            });

            if (existingEmail) {
                await t.rollback();
                return res.status(400).json({
                    error: true,
                    message: 'Email already exists'
                });
            }

            const emailVerificationToken = crypto.randomBytes(32).toString('hex');
            const emailVerificationExpires = Date.now() + 3600000;

            user.credentials.email = email
            user.credentials.email_verification_token = emailVerificationToken
            user.credentials.email_verification_expires = emailVerificationExpires
            user.credentials.is_email_verified = false

            updateData.email = email;

            await user.credentials.save({ transaction: t });

            await sendVerificationEmailUpdate(email, emailVerificationToken);

        }

        if (req.file) {
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${user_id}-${Date.now()}.${fileExt}`;
            const filePath = `profile-pictures/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('profiles')
                .upload(filePath, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`Error uploading file: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase
                .storage
                .from('profiles')
                .getPublicUrl(filePath);

            if (user.profile_photo_url) {
                try {
                    const oldFilePath = user.profile_photo_url.split('/').pop();
                    await supabase
                        .storage
                        .from('profiles')
                        .remove([`profile-pictures/${oldFilePath}`]);
                } catch (error) {
                    console.error('Error deleting old profile photo:', error);
                }
            }

            updateData.profile_photo_url = publicUrl;
        }

        if (name && name !== user.name) {
            updateData.name = name;
        }

        if (birthday && birthday !== user.birthday) {
            updateData.birthday = birthday;
        }

        if (Object.keys(updateData).length === 0) {
            await t.rollback();
            return res.status(200).json({
                error: false,
                message: 'No changes to update',
                user: {
                    email: user.email,
                    name: user.name,
                    birthday: user.birthday
                }
            });
        }

        const updatedUser = await user.update(updateData, { transaction: t });

        // if (email && email !== user.email) {
        //     const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        //     const emailVerificationExpires = Date.now() + 3600000;

        //     user.credentials.email = email
        //     user.credentials.email_verification_token = emailVerificationToken
        //     user.credentials.email_verification_expires = emailVerificationExpires
        //     user.credentials.is_email_verified = false
        //     await user.credentials.save({ transaction: t });

        //     await sendVerificationEmailUpdate(email, emailVerificationToken);
        // }

        await t.commit();

        res.status(200).json({
            error: false,
            message: 'User updated successfully',
            user: {
                email: updatedUser.email,
                name: updatedUser.name,
                birthday: updatedUser.birthday,
                profile_photo_url: updatedUser.profile_photo_url
            }
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({
            error: true,
            message: error.message
        });
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