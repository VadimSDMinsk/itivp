const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const app = express();
const PORT = 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: false
  }
});
const tripsRouter = require('./routes/trips');
const { authRouter, profileRouter } = require('./routes/auth');
const adminRouter = require('./routes/admin');
const notificationsRouter = require('./routes/notifications');
const { sequelize } = require('./models');
const mongoTripsRouter = require('./mongo/routes/trips');
const { connectMongoDB } = require('./mongo/config/database');
const initializeSocket = require('./sockets');

initializeSocket(io);
app.set('io', io);

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/auth', authRouter);
app.use('/profile', profileRouter);
app.use('/admin', adminRouter);
app.use('/notifications', notificationsRouter);
app.use('/trips', tripsRouter);
app.use('/mongo/trips', mongoTripsRouter);
app.get('/', (req, res) => {
  res.json({
    message: 'API системы путевых листов',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login',
      'GET /profile',
      'GET /admin/users',
      'GET /notifications',
      'GET /notifications/unread-count',
      'PATCH /notifications/:id/read',
      'PATCH /notifications/read-all',
      'GET /trips',
      'GET /trips/:id',
      'POST /trips',
      'PUT /trips/:id',
      'PATCH /trips/:id',
      'DELETE /trips/:id',
      'GET /mongo/trips',
      'GET /mongo/trips/:id',
      'POST /mongo/trips',
      'PUT /mongo/trips/:id',
      'PATCH /mongo/trips/:id',
      'DELETE /mongo/trips/:id',
      'POST /mongo/trips/:id/stops'
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

connectMongoDB();

httpServer.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
