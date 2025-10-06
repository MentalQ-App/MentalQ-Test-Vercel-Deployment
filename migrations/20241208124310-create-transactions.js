"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
      await queryInterface.createTable("transactions", {
         transaction_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "transaction_id",
         },

         order_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
         },

         psychologist_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
               model: "psychologist",
               key: "psychologist_id",
            },
         },
         price: {
            type: Sequelize.INTEGER,
            allowNull: false,
         },
         buyer_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
               model: "users",
               key: "user_id",
            },
         },
         isPaid: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
         },
         createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
         updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
         },
      });
   },
   async down(queryInterface, Sequelize) {
      await queryInterface.dropTable("transactions");
   },
};
