'use strict';

const express = require('express');
const tripsController = require('../controllers/tripsController');
const { authenticate, isAdmin } = require('../../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', tripsController.getAllTrips);
router.get('/:id', tripsController.getTripById);
router.post('/', isAdmin, tripsController.createTrip);
router.put('/:id', isAdmin, tripsController.replaceTrip);
router.patch('/:id', isAdmin, tripsController.patchTrip);
router.delete('/:id', isAdmin, tripsController.deleteTrip);
router.post('/:id/stops', isAdmin, tripsController.addStop);

module.exports = router;
