const { Trip, Sequelize, sequelize } = require('../models');
const {
  createTripNotifications,
  emitSavedNotifications
} = require('../services/notificationService');

const { Op } = Sequelize;

function validateTripData(body = {}, isUpdate = false) {
  const errors = [];

  if (!isUpdate || body.driverName !== undefined) {
    if (!body.driverName || typeof body.driverName !== 'string' || body.driverName.trim() === '') {
      errors.push('Поле "driverName" обязательно и должно быть непустой строкой');
    }
  }

  if (!isUpdate || body.vehicleNumber !== undefined) {
    if (!body.vehicleNumber || typeof body.vehicleNumber !== 'string' || body.vehicleNumber.trim() === '') {
      errors.push('Поле "vehicleNumber" обязательно и должно быть непустой строкой');
    }
  }

  if (body.workHours !== undefined && (typeof body.workHours !== 'number' || body.workHours < 0)) {
    errors.push('Поле "workHours" должно быть неотрицательным числом');
  }

  if (body.fuelConsumed !== undefined && (typeof body.fuelConsumed !== 'number' || body.fuelConsumed < 0)) {
    errors.push('Поле "fuelConsumed" должно быть неотрицательным числом');
  }

  return errors;
}

function handleSequelizeError(error, res, next) {
  if (error instanceof Sequelize.UniqueConstraintError) {
    return res.status(409).json({
      error: 'Нарушено ограничение уникальности',
      details: error.errors.map(item => item.message)
    });
  }

  if (error instanceof Sequelize.ValidationError) {
    return res.status(400).json({
      error: 'Ошибка валидации данных',
      details: error.errors.map(item => item.message)
    });
  }

  if (error instanceof Sequelize.DatabaseError) {
    return res.status(500).json({ error: 'Ошибка базы данных' });
  }

  return next(error);
}

exports.getAllTrips = async (req, res, next) => {
  try {
    const where = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.driverName) {
      where.driverName = { [Op.iLike]: `%${req.query.driverName}%` };
    }

    const trips = await Trip.findAll({ where });
    res.status(200).json({ count: trips.length, data: trips });
  } catch (error) {
    handleSequelizeError(error, res, next);
  }
};

exports.getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }
    res.status(200).json({ data: trip });
  } catch (error) {
    handleSequelizeError(error, res, next);
  }
};

exports.createTrip = async (req, res, next) => {
  try {
    const errors = validateTripData(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Некорректные данные запроса', details: errors });
    }

    const io = req.app.get('io');
    if (!io) {
      return res.status(503).json({ error: 'Сервис уведомлений временно недоступен' });
    }

    const result = await sequelize.transaction(async transaction => {
      const newTrip = await Trip.create(req.body, { transaction });
      const notifications = await createTripNotifications({
        trip: newTrip,
        actorUserId: req.user.id,
        type: 'trip_created',
        transaction
      });

      return { trip: newTrip, notifications };
    });

    emitSavedNotifications(io, result.notifications);
    res.status(201).json({ message: 'Путевой лист успешно создан', data: result.trip });
  } catch (error) {
    handleSequelizeError(error, res, next);
  }
};

async function updateTrip(req, res, next, isPatch) {
  try {
    const errors = validateTripData(req.body, isPatch);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Некорректные данные запроса', details: errors });
    }

    const io = req.app.get('io');
    if (!io) {
      return res.status(503).json({ error: 'Сервис уведомлений временно недоступен' });
    }

    const result = await sequelize.transaction(async transaction => {
      const existing = await Trip.findByPk(req.params.id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!existing) return null;

      const previousStatus = existing.status;
      await Trip.update(req.body, {
        where: { id: req.params.id },
        returning: true,
        transaction
      });
      const updated = await Trip.findByPk(req.params.id, { transaction });
      const type = previousStatus !== 'completed' && updated.status === 'completed'
        ? 'trip_completed'
        : 'trip_updated';
      const notifications = await createTripNotifications({
        trip: updated,
        actorUserId: req.user.id,
        type,
        transaction
      });

      return { trip: updated, notifications };
    });

    if (!result) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    emitSavedNotifications(io, result.notifications);
    const message = isPatch ? 'Путевой лист частично обновлён' : 'Путевой лист полностью обновлён';
    res.status(200).json({ message, data: result.trip });
  } catch (error) {
    handleSequelizeError(error, res, next);
  }
}

exports.updateTrip = (req, res, next) => updateTrip(req, res, next, false);

exports.patchTrip = (req, res, next) => updateTrip(req, res, next, true);

exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
    }

    await trip.destroy();
    res.status(200).json({ message: 'Путевой лист удалён', data: trip });
  } catch (error) {
    handleSequelizeError(error, res, next);
  }
};