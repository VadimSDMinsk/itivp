// routes/trips.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tripsController');

router.get('/',       ctrl.getAllTrips);
router.get('/:id',    ctrl.getTripById);
router.post('/',      ctrl.createTrip);
router.put('/:id',    ctrl.updateTrip);
router.patch('/:id',  ctrl.patchTrip);
router.delete('/:id', ctrl.deleteTrip);

module.exports = router;