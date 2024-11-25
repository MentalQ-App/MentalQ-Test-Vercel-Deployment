'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('credentials', {
      credentials_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      email_verification_token: {
        type: Sequelize.STRING
      },
      email_verification_expires: {
        type: Sequelize.DATE
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN
      },
      role: {
        type: Sequelize.ENUM('user', 'psychologist')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('credentials');
  }
};