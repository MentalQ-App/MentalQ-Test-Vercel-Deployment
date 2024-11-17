const db = require('../models');
const { Users, Credentials } = db;

exports.createUser = async (req, res) => {
    const { credentials_id, email, name, birthday } = req.body;
    let t;

    try {
        if (!credentials_id || !email || !name || !birthday) {
            return res.status(400).json({
                error: true,
                message: 'All fields are required'
            });
        }

        t = await db.sequelize.transaction();

        const existingUser = await Users.findOne({
            where: { email },
            transaction: t
        });

        if (existingUser) {
            await t.rollback();
            return res.status(400).json({
                error: true,
                message: 'Email already exists'
            });
        }

        const newUser = await Users.create(
            { 
                credentials_id, 
                email, 
                name, 
                birthday 
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
            message: 'User created successfully',
            user: safeUser
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({
            error: true,
            message: error.message
        });
    }
};

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

exports.updateUser = async (req, res) => {
    const user_id = req.user_id;
    const { email, name, birthday } = req.body;
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
        }

        const updatedUser = await user.update({
            email: email || user.email,
            name: name || user.name,
            birthday: birthday || user.birthday
        }, { transaction: t });

        await t.commit();

        const safeUser = {
            email: updatedUsers.email,
            name: updatedUsers.name,
            birthday: updatedUsers.birthday
        };

        res.status(200).json({
            error: false,
            message: 'User updated successfully',
            user: safeUser
        });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({
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