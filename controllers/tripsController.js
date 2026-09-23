const Trip = require('../models/tripsModel');

function validateTripData(body, isUpdate = false) {
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

exports.getAllTrips = (req, res) => {
  const result = Trip.getAll(req.query);
  res.status(200).json({ count: result.length, data: result });
};

exports.getTripById = (req, res) => {
  const trip = Trip.getById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
  }
  res.status(200).json({ data: trip });
};

exports.createTrip = (req, res) => {
  const errors = validateTripData(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Некорректные данные запроса', details: errors });
  }
  const newTrip = Trip.create(req.body);
  res.status(201).json({ message: 'Путевой лист успешно создан', data: newTrip });
};

exports.updateTrip = (req, res) => {
  const existing = Trip.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
  }

  const errors = validateTripData(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Некорректные данные запроса', details: errors });
  }

  const updated = Trip.update(req.params.id, req.body);
  res.status(200).json({ message: 'Путевой лист полностью обновлён', data: updated });
};

exports.patchTrip = (req, res) => {
  const existing = Trip.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
  }

  const errors = validateTripData(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Некорректные данные запроса', details: errors });
  }

  const updated = Trip.patch(req.params.id, req.body);
  res.status(200).json({ message: 'Путевой лист частично обновлён', data: updated });
};

exports.deleteTrip = (req, res) => {
  const deleted = Trip.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: `Путевой лист с id=${req.params.id} не найден` });
  }
  res.status(200).json({ message: 'Путевой лист удалён', data: deleted });
};