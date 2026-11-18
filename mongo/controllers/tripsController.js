'use strict';

const mongoose = require('mongoose');
const Trip = require('../models/Trip');

const tripFields = [
  'driverName',
  'vehicleNumber',
  'route',
  'departureTime',
  'returnTime',
  'workHours',
  'fuelConsumed',
  'status',
  'notes',
  'stops'
];

function pickTripFields(body = {}) {
  return Object.fromEntries(
    tripFields
      .filter(field => Object.prototype.hasOwnProperty.call(body, field))
      .map(field => [field, body[field]])
  );
}

function validateId(req, res) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    res.status(400).json({ error: 'Некорректный идентификатор путевого листа' });
    return false;
  }

  return true;
}

function ensureMongoDB(res) {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  res.status(503).json({ error: 'MongoDB временно недоступна' });
  return false;
}

function handleMongoError(error, res, next) {
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: 'Ошибка валидации данных',
      details: Object.values(error.errors).map(item => item.message)
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Некорректное значение поля', details: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: 'Документ нарушает ограничение уникальности' });
  }

  if (
    error.name === 'MongoServerSelectionError' ||
    error.name === 'MongoNetworkError' ||
    /buffering timed out/i.test(error.message)
  ) {
    return res.status(503).json({ error: 'MongoDB временно недоступна' });
  }

  return next(error);
}

exports.getAllTrips = async (req, res, next) => {
  if (!ensureMongoDB(res)) return;

  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    return res.status(200).json({ count: trips.length, data: trips });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};

exports.getTripById = async (req, res, next) => {
  if (!validateId(req, res) || !ensureMongoDB(res)) return;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    return res.status(200).json({ data: trip });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};

exports.createTrip = async (req, res, next) => {
  if (!ensureMongoDB(res)) return;

  try {
    const trip = await Trip.create(pickTripFields(req.body));
    return res.status(201).json({ message: 'Путевой лист успешно создан', data: trip });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};

exports.replaceTrip = async (req, res, next) => {
  if (!validateId(req, res) || !ensureMongoDB(res)) return;

  try {
    const trip = await Trip.findOneAndReplace(
      { _id: req.params.id },
      pickTripFields(req.body),
      { new: true, runValidators: true }
    );
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    return res.status(200).json({ message: 'Путевой лист полностью обновлён', data: trip });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};

exports.patchTrip = async (req, res, next) => {
  if (!validateId(req, res) || !ensureMongoDB(res)) return;

  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: pickTripFields(req.body) },
      { new: true, runValidators: true }
    );
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    return res.status(200).json({ message: 'Путевой лист частично обновлён', data: trip });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};

exports.deleteTrip = async (req, res, next) => {
  if (!validateId(req, res) || !ensureMongoDB(res)) return;

  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    return res.status(200).json({ message: 'Путевой лист удалён', data: trip });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};

exports.addStop = async (req, res, next) => {
  if (!validateId(req, res) || !ensureMongoDB(res)) return;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    trip.stops.push(req.body || {});
    await trip.save();
    return res.status(201).json({ message: 'Остановка добавлена', data: trip });
  } catch (error) {
    return handleMongoError(error, res, next);
  }
};
