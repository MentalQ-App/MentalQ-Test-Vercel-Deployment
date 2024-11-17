'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
try {
  if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
} catch (error) {
  console.error('Error connecting to the database:', error);
  process.exit(1);
}

// First, read all model files
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

console.log('Found model files:', modelFiles);

// Load all models
modelFiles.forEach(file => {
  try {
    const modelPath = path.join(__dirname, file);
    console.log(`Loading model from ${file}...`);
    
    const model = require(modelPath)(sequelize, Sequelize.DataTypes);
    
    if (!model.name) {
      console.error(`Model in ${file} does not have a name property`);
      return;
    }
    
    console.log(`Successfully loaded model: ${model.name}`);
    db[model.name] = model;
  } catch (error) {
    console.error(`Error loading model ${file}:`, error);
  }
});

// Set up associations
console.log('Setting up model associations...');
Object.keys(db).forEach(modelName => {
  try {
    console.log(`Checking associations for model: ${modelName}`);
    if (db[modelName].associate) {
      db[modelName].associate(db);
      console.log(`Successfully set up associations for: ${modelName}`);
    }
  } catch (error) {
    console.error(`Error setting up associations for model ${modelName}:`, error);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Verify all models are loaded
console.log('Loaded models:', Object.keys(db));

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = db;