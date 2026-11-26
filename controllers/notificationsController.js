'use strict';

const { Notification } = require('../models');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseLimit(value) {
  if (value === undefined) return DEFAULT_LIMIT;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;

  const limit = Number(value);
  if (!Number.isSafeInteger(limit)) return null;
  return Math.min(limit, MAX_LIMIT);
}

exports.getNotifications = async (req, res, next) => {
  const limit = parseLimit(req.query.limit);
  if (limit === null) {
    return res.status(400).json({ error: 'Параметр limit должен быть положительным целым числом' });
  }

  try {
    const notifications = await Notification.findAll({
      where: { recipientUserId: req.user.id },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit
    });

    return res.status(200).json({
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.count({
      where: {
        recipientUserId: req.user.id,
        readAt: null
      }
    });

    return res.status(200).json({ unreadCount });
  } catch (error) {
    return next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) {
    return res.status(404).json({ error: 'Уведомление не найдено' });
  }

  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        recipientUserId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save({ fields: ['readAt'] });
    }

    return res.status(200).json({ data: notification });
  } catch (error) {
    return next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const [updatedCount] = await Notification.update({
      readAt: new Date()
    }, {
      where: {
        recipientUserId: req.user.id,
        readAt: null
      }
    });

    return res.status(200).json({ updatedCount });
  } catch (error) {
    return next(error);
  }
};
