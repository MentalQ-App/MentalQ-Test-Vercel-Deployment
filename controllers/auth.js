const db = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { Users, Credentials, UserSessions } = db;

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