'use strict';

const bcrypt = require('bcrypt');
const { User } = require('../models');

const demoUsers = [
  { email: 'driver@example.com', password: 'Driver123!', role: 'user' },
  { email: 'admin@example.com', password: 'Admin123!', role: 'admin' }
];

module.exports = {
  async up() {
    for (const demoUser of demoUsers) {
      const passwordHash = await bcrypt.hash(demoUser.password, 10);
      await User.findOrCreate({
        where: { email: demoUser.email },
        defaults: {
          email: demoUser.email,
          passwordHash,
          role: demoUser.role
        }
      });
    }
  },

  async down() {
    for (const demoUser of demoUsers) {
      await User.destroy({ where: { email: demoUser.email } });
    }
  }
};