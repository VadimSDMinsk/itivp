'use strict';

const jwt = require('jsonwebtoken');
const { createPresenceNotifications } = require('../services/notificationService');

function savePresenceNotification(io, user, type) {
  createPresenceNotifications(io, user, type).catch(error => {
    console.error('Не удалось сохранить уведомление о присутствии пользователя:', error.message);
  });
}

function initializeSocket(io) {
  const activeConnections = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || token.length === 0) {
      return next(new Error('Требуется авторизация'));
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(new Error('Недействительный токен'));
    }

    if (
      !payload ||
      typeof payload !== 'object' ||
      !Number.isInteger(payload.id) ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string'
    ) {
      return next(new Error('Недействительный токен'));
    }

    socket.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
    return next();
  });

  io.on('connection', socket => {
    const user = socket.user;
    const userRoom = `user:${user.id}`;
    const existingConnections = activeConnections.get(user.id) || 0;

    socket.join(userRoom);
    if (user.role === 'admin') {
      socket.join('role:admin');
    }

    activeConnections.set(user.id, existingConnections + 1);
    if (existingConnections === 0) {
      io.to('role:admin').emit('user:connected', user);
      savePresenceNotification(io, user, 'user_connected');
    }

    socket.on('disconnect', () => {
      const remainingConnections = (activeConnections.get(user.id) || 1) - 1;
      if (remainingConnections > 0) {
        activeConnections.set(user.id, remainingConnections);
        return;
      }

      activeConnections.delete(user.id);
      io.to('role:admin').emit('user:disconnected', user);
      savePresenceNotification(io, user, 'user_disconnected');
    });
  });

  return io;
}

module.exports = initializeSocket;
