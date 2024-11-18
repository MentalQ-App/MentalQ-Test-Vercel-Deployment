const express = require('express');
const path = require('path');
const userRoutes = require('./routes/routes');
const config = require('./config/config');
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

async function startServer() {
    try {
        // Authenticate the database connection
        try {
            await db.sequelize.authenticate();
            console.log('Database connection established successfully.');
        } catch (err) {
            console.error('Unable to connect to the database:', err);
            process.exit(1); // Exit if the database connection fails
        }
        
        // Sync database (conditionally based on the environment)
        const syncOptions = process.env.NODE_ENV === 'production' ? { alter: false } : { alter: true };
        await db.sequelize.sync(syncOptions);
        console.log('Database synced');

        // Start the server
        app.listen(port, host, () => {
            console.log(`Server is running on ${host}:${port}`);
        });

    } catch (error) {
        console.error('Error during startup:', error);
        process.exit(1);
    }
}

// Database connection and server startup
startServer();

// Export app and sequelize correctly from db object
module.exports = app;
