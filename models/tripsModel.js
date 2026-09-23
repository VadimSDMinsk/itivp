let trips = [
  {
    id: 1,
    driverName: 'Иванов И.И.',
    vehicleNumber: 'А123ВС77',
    route: 'Москва — Тула',
    departureTime: '2025-01-15T08:00:00',
    returnTime: '2025-01-15T18:30:00',
    workHours: 10.5,
    fuelConsumed: 45.2,
    status: 'completed'
  },
  {
    id: 2,
    driverName: 'Петров П.П.',
    vehicleNumber: 'В456ЕК50',
    route: 'Москва — Калуга',
    departureTime: '2025-01-16T07:30:00',
    returnTime: null,
    workHours: 0,
    fuelConsumed: 0,
    status: 'in_progress'
  }
];

let nextId = 3;

module.exports = {
  getAll: (filters = {}) => {
    let result = [...trips];
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }
    if (filters.driverName) {
      result = result.filter(t =>
        t.driverName.toLowerCase().includes(filters.driverName.toLowerCase())
      );
    }
    return result;
  },

  getById: (id) => trips.find(t => t.id === Number(id)),

  create: (data) => {
    const newTrip = {
      id: nextId++,
      driverName: data.driverName.trim(),
      vehicleNumber: data.vehicleNumber.trim(),
      route: data.route || '',
      departureTime: data.departureTime || new Date().toISOString(),
      returnTime: data.returnTime || null,
      workHours: data.workHours || 0,
      fuelConsumed: data.fuelConsumed || 0,
      status: data.status || 'in_progress'
    };
    trips.push(newTrip);
    return newTrip;
  },

  update: (id, data) => {
    const trip = trips.find(t => t.id === Number(id));
    if (!trip) return null;

    trip.driverName = data.driverName.trim();
    trip.vehicleNumber = data.vehicleNumber.trim();
    trip.route = data.route || '';
    trip.departureTime = data.departureTime || trip.departureTime;
    trip.returnTime = data.returnTime !== undefined ? data.returnTime : trip.returnTime;
    trip.workHours = data.workHours !== undefined ? data.workHours : trip.workHours;
    trip.fuelConsumed = data.fuelConsumed !== undefined ? data.fuelConsumed : trip.fuelConsumed;
    trip.status = data.status || trip.status;

    return trip;
  },

  patch: (id, data) => {
    const trip = trips.find(t => t.id === Number(id));
    if (!trip) return null;

    Object.keys(data).forEach(key => {
      if (key !== 'id') trip[key] = data[key];
    });
    return trip;
  },

  remove: (id) => {
    const index = trips.findIndex(t => t.id === Number(id));
    if (index === -1) return null;
    return trips.splice(index, 1)[0];
  }
};