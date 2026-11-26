'use strict';

const express = require('express');
const notificationsController = require('../controllers/notificationsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/unread-count', notificationsController.getUnreadCount);
router.get('/', notificationsController.getNotifications);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);

module.exports = router;
