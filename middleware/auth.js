'use strict';

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);

  if (!match) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    req.user = jwt.verify(match[1], process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  return next();
}

module.exports = { authenticate, isAdmin };