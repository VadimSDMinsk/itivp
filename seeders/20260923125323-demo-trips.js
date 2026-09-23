'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('trips', [
      {
        driver_name: 'Иванов Иван Иванович',
        vehicle_number: 'А123ВС77',
        route: 'Москва — Тула',
        departure_time: new Date('2026-09-20T07:30:00'),
        return_time: new Date('2026-09-20T18:00:00'),
        work_hours: 10.5,
        fuel_consumed: 42.3,
        status: 'completed',
        notes: 'Доставка документов в филиал.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        driver_name: 'Петров Сергей Алексеевич',
        vehicle_number: 'В456ЕК50',
        route: 'Москва — Калуга',
        departure_time: new Date('2026-09-21T08:00:00'),
        return_time: null,
        work_hours: 5.25,
        fuel_consumed: 24.8,
        status: 'in_progress',
        notes: 'Ожидается возвращение водителя.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        driver_name: 'Сидоров Алексей Петрович',
        vehicle_number: 'С789ОР199',
        route: 'Москва — Рязань',
        departure_time: new Date('2026-09-18T06:45:00'),
        return_time: new Date('2026-09-18T16:20:00'),
        work_hours: 9.5,
        fuel_consumed: 38.6,
        status: 'completed',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        driver_name: 'Кузнецов Дмитрий Олегович',
        vehicle_number: 'Е321ТК77',
        route: 'Москва — Владимир',
        departure_time: new Date('2026-09-19T09:15:00'),
        return_time: null,
        work_hours: 0,
        fuel_consumed: 0,
        status: 'cancelled',
        notes: 'Рейс отменён из-за неисправности автомобиля.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        driver_name: 'Смирнов Николай Викторович',
        vehicle_number: 'М555АА197',
        route: 'Москва — Тверь',
        departure_time: new Date('2026-09-22T05:50:00'),
        return_time: new Date('2026-09-22T15:10:00'),
        work_hours: 9.33,
        fuel_consumed: 35.1,
        status: 'completed',
        notes: 'Маршрут выполнен без замечаний.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('trips', {
      vehicle_number: ['А123ВС77', 'В456ЕК50', 'С789ОР199', 'Е321ТК77', 'М555АА197']
    });
  }
};
