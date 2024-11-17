const mysql2 = require('mysql2');
require('dotenv').config();  

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || null,
    database: process.env.DB_NAME || 'mentalqdb',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: true
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'my_database_test',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306, 
    dialect: process.env.DB_DIALECT,
    dialectModule: mysql2,
    logging: false,
    dialectOptions: {
      ssl: {
        require: false,
        rejectUnauthorized: false
      }
    }
  }
};
