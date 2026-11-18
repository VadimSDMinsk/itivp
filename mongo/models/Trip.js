'use strict';

const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название остановки обязательно'],
    trim: true
  },
  arrivalTime: Date,
  departureTime: Date,
  notes: String
});

const tripSchema = new mongoose.Schema({
  driverName: {
    type: String,
    required: [true, 'Имя водителя обязательно'],
    trim: true
  },
  vehicleNumber: {
    type: String,
    required: [true, 'Номер автомобиля обязателен'],
    trim: true
  },
  route: String,
  departureTime: Date,
  returnTime: Date,
  workHours: {
    type: Number,
    default: 0,
    min: [0, 'Количество рабочих часов не может быть отрицательным']
  },
  fuelConsumed: {
    type: Number,
    default: 0,
    min: [0, 'Расход топлива не может быть отрицательным']
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  notes: String,
  stops: [stopSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
