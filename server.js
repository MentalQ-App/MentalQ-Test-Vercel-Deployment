const express = require('express');
const path = require('path');
const userRoutes = require('./routes/routes');
const config = require('./config/config.json');
const db = require('./models');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

// Database connection and server startup
db.sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
        
        return db.sequelize.sync({ alter: false, force: false });
    })
    .then(() => {
        console.log('Database synced');
        app.listen(port, host, () => {
            console.log(`Server is running on ${host}:${port}`);
        });
    })
    .catch((err) => {
        console.error('Error during startup:', err);
        process.exit(1);
    });

// Export app and sequelize correctly from db object
module.exports = { 
    app, 
    sequelize: db.sequelize 
};