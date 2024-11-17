const { Sequelize, QueryInterface } = require('sequelize');
const config = require('./config/config.js');
const dbConfig = config['development'];  // Or 'production' if you're deploying

async function runMigrations() {
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

    try {
        await sequelize.authenticate();
        console.log('Database connection established.');

        const queryInterface = sequelize.getQueryInterface();

        // Add migration logic here (e.g., creating tables, adding columns, etc.)
        // Example of running a manual migration to create a table
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        console.log('Migrations completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1); // Exit with failure status if migration fails
    } finally {
        await sequelize.close();
    }
}

// Export the function correctly
module.exports = runMigrations;
