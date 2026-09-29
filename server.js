const express = require('express');
const app = express();
const PORT = 3000;
const tripsRouter = require('./routes/trips');
const { authRouter, profileRouter } = require('./routes/auth');
const adminRouter = require('./routes/admin');
const { sequelize } = require('./models');

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/admin', adminRouter);
app.use('/trips', tripsRouter);
app.get('/', (req, res) => {
  res.json({
    message: 'API системы путевых листов',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET /profile',
      'GET /admin/users',
      'GET /trips',
      'GET /trips/:id',
      'POST /trips',
      'PUT /trips/:id',
      'PATCH /trips/:id',
      'DELETE /trips/:id'
    ]
  });
});
app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
});
app.use((err, req, res, next) => {
  console.error('Ошибка:', err.stack);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

sequelize.authenticate()
  .then(() => console.log('БД подключена успешно'))
  .catch(err => console.error('Ошибка подключения к БД:', err));

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
