'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chats extends Model {
    static associate(models) {
      // Define associations
      Chats.belongsTo(models.User, { 
        as: 'Sender', 
        foreignKey: 'sender_id' 
      });
      Chats.belongsTo(models.User, { 
        as: 'Receiver', 
        foreignKey: 'receiver_id' 
      });
    }
  }
  Chats.init({
    chat_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Sender is required' }
      }
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Receiver is required' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message cannot be empty' }
      }
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attachment_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    }
  }, {
    sequelize,
    modelName: 'Chats',
    tableName: 'chats'
  });
  return Chats;
};