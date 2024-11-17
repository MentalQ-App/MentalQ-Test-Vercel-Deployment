// config/database.js
const mysql2 = require('mysql2');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,      // Database name
    process.env.DB_USER,      // Database username
    process.env.DB_PASS,      // Database password
    {
        host: process.env.DB_HOST,   // Database host
        port: process.env.DB_PORT,   // Database port
        dialect: process.env.DB_DIALECT, // Database dialect (e.g., postgres, mysql)
        dialectModule: mysql2,
        logging: console.log,              // Disable SQL query logging (optional)
        define: {
            engine : 'InnoDB',
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
            timestamps: true,
            underscored: true,
        }
    }
);

// Test the connection to the database
sequelize.authenticate()
    .then(() => console.log('Database connected...'))
    .catch((err) => console.error('Unable to connect to the database:', err));

module.exports = { sequelize };
