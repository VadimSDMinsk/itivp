'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    recipientUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'recipient_user_id'
    },
    actorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'actor_user_id'
    },
    tripId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'trip_id'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'trip_created',
          'trip_updated',
          'trip_completed',
          'user_connected',
          'user_disconnected'
        ]]
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'notifications',
    timestamps: false
  });

  Notification.associate = models => {
    Notification.belongsTo(models.User, {
      as: 'recipient',
      foreignKey: 'recipientUserId',
      onDelete: 'RESTRICT'
    });
    Notification.belongsTo(models.User, {
      as: 'actor',
      foreignKey: 'actorUserId',
      onDelete: 'SET NULL'
    });
    Notification.belongsTo(models.Trip, {
      as: 'trip',
      foreignKey: 'tripId',
      onDelete: 'SET NULL'
    });
  };

  return Notification;
};
