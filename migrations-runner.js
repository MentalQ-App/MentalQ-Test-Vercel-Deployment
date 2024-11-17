const { Sequelize } = require('sequelize');
const { Umzug } = require('umzug');
const config = require('./config/config.json');

async function runMigrations() {
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = config[env];

    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            dialect: dbConfig.dialect,
            logging: console.log,
        }
    );

    const umzug = new Umzug({
        migrations: {
            path: './migrations',
            params: [sequelize.getQueryInterface(), Sequelize],
        },
        storage: 'sequelize',
        storageOptions: {
            sequelize: sequelize,  // Ensure this is the correct sequelize instance
        },
    });

    try {
        await umzug.up();
        console.log('Migrations completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
        throw err;
    }
}

module.exports = runMigrations;
