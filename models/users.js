"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
   class Users extends Model {
      /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
      static associate(models) {
         Users.belongsTo(models.Credentials, {
            foreignKey: "credentials_id",
            as: "credentials",
         });

         Users.hasMany(models.Notes, {
            foreignKey: "user_id",
            as: "notes",
         });

         Users.hasOne(models.Psychologist, {
            foreignKey: "user_id",
            as: "psychologist",
         });
      }
   }

   Users.init(
      {
         user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "user_id",
         },
         credentials_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
               model: "credentials",
               key: "credentials_id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
         },
         email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
               isEmail: true,
            },
         },
         name: {
            type: DataTypes.STRING,
            allowNull: false,
         },
         birthday: {
            type: DataTypes.DATEONLY,
            allowNull: true,
         },
         profile_photo_url: {
            type: DataTypes.STRING,
            allowNull: true,
         },
      },
      {
         sequelize,
         modelName: "Users",
         tableName: "users",
      }
   );

   return Users;
};
