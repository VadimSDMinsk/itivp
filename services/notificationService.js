'use strict';

const { Notification, User, sequelize } = require('../models');

async function findAdminIds(transaction) {
  const administrators = await User.findAll({
    attributes: ['id'],
    where: { role: 'admin' },
    transaction
  });

  return administrators.map(user => user.id);
}

async function createNotificationRows({
  recipientIds,
  actorUserId,
  tripId = null,
  type,
  title,
  message,
  data,
  transaction
}) {
  const uniqueRecipientIds = [...new Set(recipientIds)];
  if (uniqueRecipientIds.length === 0) return [];

  return Notification.bulkCreate(uniqueRecipientIds.map(recipientUserId => ({
    recipientUserId,
    actorUserId,
    tripId,
    type,
    title,
    message,
    data
  })), {
    transaction,
    returning: true
  });
}

async function createTripNotifications({ trip, actorUserId, type, transaction }) {
  const recipientIds = new Set((await findAdminIds(transaction)).map(Number));
  if (trip.driverUserId !== null && trip.driverUserId !== undefined) {
    recipientIds.add(Number(trip.driverUserId));
  }

  const action = type === 'trip_created'
    ? 'создан'
    : type === 'trip_completed'
      ? 'завершён'
      : 'изменён';

  return createNotificationRows({
    recipientIds: [...recipientIds],
    actorUserId,
    tripId: trip.id,
    type,
    title: `Путевой лист ${action}`,
    message: `Путевой лист №${trip.id} водителя ${trip.driverName} ${action}.`,
    data: {
      tripId: trip.id,
      driverName: trip.driverName,
      vehicleNumber: trip.vehicleNumber,
      status: trip.status
    },
    transaction
  });
}

function emitSavedNotifications(io, notifications) {
  for (const notification of notifications) {
    const payload = notification.get({ plain: true });

    try {
      io.to(`user:${payload.recipientUserId}`).emit('notification:new', payload);
    } catch (error) {
      console.error('Не удалось отправить сохранённое уведомление через Socket.IO:', error.message);
    }
  }
}

async function createPresenceNotifications(io, user, type) {
  const isConnected = type === 'user_connected';
  const notifications = await sequelize.transaction(async transaction => {
    const recipientIds = await findAdminIds(transaction);
    return createNotificationRows({
      recipientIds,
      actorUserId: user.id,
      type,
      title: isConnected ? 'Пользователь подключился' : 'Пользователь отключился',
      message: `Пользователь ${user.email} (${user.role}) ${isConnected ? 'подключился' : 'отключился'}.`,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      transaction
    });
  });

  emitSavedNotifications(io, notifications);
}

module.exports = {
  createTripNotifications,
  createPresenceNotifications,
  emitSavedNotifications
};
