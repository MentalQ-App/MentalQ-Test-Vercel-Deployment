'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSessions extends Model {
    static associate(models) {
      UserSessions.belongsTo(models.Users, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  UserSessions.init(
    {
      session_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'session_id',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      session_token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UserSessions',
      tableName: 'user_sessions',
    }
  );

  return UserSessions;
};
