'use strict';

const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticate, isAdmin, adminController.listUsers);

module.exports = router;