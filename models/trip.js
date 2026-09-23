'use strict';

module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define('Trip', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    driverName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'driver_name',
      validate: {
        notEmpty: {
          msg: 'ФИО водителя обязательно'
        }
      }
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'vehicle_number',
      validate: {
        notEmpty: {
          msg: 'Госномер автомобиля обязателен'
        }
      }
    },
    route: {
      type: DataTypes.STRING,
      allowNull: true
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'departure_time',
      defaultValue: DataTypes.NOW
    },
    returnTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'return_time'
    },
    workHours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      field: 'work_hours',
      validate: {
        min: {
          args: [0],
          msg: 'Отработанные часы не могут быть отрицательными'
        }
      }
    },
    fuelConsumed: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      field: 'fuel_consumed',
      validate: {
        min: {
          args: [0],
          msg: 'Расход топлива не может быть отрицательным'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'in_progress'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'trips'
  });

  return Trip;
};