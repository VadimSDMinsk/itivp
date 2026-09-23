'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('trips', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      driver_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicle_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      route: {
        type: Sequelize.STRING,
        allowNull: true
      },
      departure_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      return_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      work_hours: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      fuel_consumed: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'in_progress'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('trips');
  }
};
