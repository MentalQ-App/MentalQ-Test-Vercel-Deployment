// server.js
const express = require('express');
const { sequelize } = require('./config/database');
const path = require('path');
const userRoutes = require('./routes/routes');

const models = require('./models');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/api', userRoutes);
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';

sequelize.sync({ alter:false, force: true })
    .then(() => {
        console.log('Database synced');
        app.listen(port, host, () => {
            console.log('Server is running');
        });
    })
    .catch((err) => console.error('Failed to sync database:', err));

module.exports = app;