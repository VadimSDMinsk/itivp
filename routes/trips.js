// routes/trips.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tripsController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate);
router.get('/',       ctrl.getAllTrips);
router.get('/:id',    ctrl.getTripById);
router.post('/',      isAdmin, ctrl.createTrip);
router.put('/:id',    isAdmin, ctrl.updateTrip);
router.patch('/:id',  isAdmin, ctrl.patchTrip);
router.delete('/:id', isAdmin, ctrl.deleteTrip);

module.exports = router;