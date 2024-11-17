// models/credentials.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Credentials = sequelize.define('credentials', {
    credentials_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'credentials_id',
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Credentials;
