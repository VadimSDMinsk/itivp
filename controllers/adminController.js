'use strict';

const { User } = require('../models');

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'],
      order: [['id', 'ASC']]
    });

    return res.status(200).json({ count: users.length, data: users });
  } catch (error) {
    return next(error);
  }
};