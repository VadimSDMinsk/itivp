'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const authRouter = express.Router();
const profileRouter = express.Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
profileRouter.get('/', authenticate, authController.getProfile);

module.exports = { authRouter, profileRouter };