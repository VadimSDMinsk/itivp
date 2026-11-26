'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      recipient_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      actor_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'trips',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('notifications', ['recipient_user_id']);
    await queryInterface.addIndex('notifications', ['recipient_user_id', 'created_at']);
    await queryInterface.addIndex('notifications', ['recipient_user_id', 'read_at']);
    await queryInterface.addConstraint('notifications', {
      fields: ['type'],
      type: 'check',
      name: 'notifications_type_allowed',
      where: {
        type: [
          'trip_created',
          'trip_updated',
          'trip_completed',
          'user_connected',
          'user_disconnected'
        ]
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  }
};
