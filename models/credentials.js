'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Credentials extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

    }
  }
  Credentials.init({
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
      allowNull: true,
    },
    firebase_uid: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'psychologist'),
      allowNull: false,
      defaultValue: 'user',
    },
  }, {
    sequelize,
    modelName: 'Credentials', 
    tableName: 'credentials',
  });
  return Credentials;
};
