'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PasswordResetTokens extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PasswordResetTokens.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user',
        onDelete: 'CASCADE'
      });
    }
  }

  PasswordResetTokens.init(
    {
      reset_token_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'user_id'
        }
      },
      token: {
        type: DataTypes.STRING(6),
        allowNull: false,
        validate: {
          len: [6, 6],
          isNumeric: true
        }
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          isAfterNow(value) {
            if (value <= new Date()) {
              throw new Error('Expiration date must be in the future');
            }
          }
        }
      }
    }, 
    {
      sequelize,
      modelName: 'PasswordResetTokens',
      tableName: 'password_reset_tokens'
    }
  );
  
  return PasswordResetTokens;
};