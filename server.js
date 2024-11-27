const express = require('express');
const path = require('path');
const userRoutes = require('./routes/routes');
const config = require('./config/config');
const db = require('./models');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/api', userRoutes);

const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

async function startServer() {
    try {
        try {
            await db.sequelize.authenticate();
            console.log('Database connection established successfully.');
        } catch (err) {
            console.error('Unable to connect to the database:', err);
            process.exit(1);
        }
        
        const syncOptions = process.env.NODE_ENV === 'production' ? { alter: false } : { alter: true };
        await db.sequelize.sync(syncOptions);
        console.log('Database synced');

        app.listen(port, host, () => {
            console.log(`Server is running on ${host}:${port}`);
        });

    } catch (error) {
        console.error('Error during startup:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
