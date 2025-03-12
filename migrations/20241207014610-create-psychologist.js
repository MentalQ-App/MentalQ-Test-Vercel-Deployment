"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("psychologist", {
         psychologist_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "psychologist_id",
         },
         user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
               model: "users",
               key: "user_id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
         },
         prefix_title: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         suffix_title: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         certificate: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         price: {
            type: Sequelize.STRING,
            allowNull: false,
         },
         isVerified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
         },
         isOnline: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
         },
         createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
         },
         updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW,
         },
      });
   },
   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("psychologist");
   },
};
