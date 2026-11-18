'use strict';

const dns = require('node:dns');
const mongoose = require('mongoose');

async function connectMongoDB() {
  const uri = process.env.MONGO_URI;

  if (!uri || !uri.trim()) {
    console.warn('MongoDB не подключена: переменная MONGO_URI не задана');
    return;
  }

  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB подключена успешно');
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error.message);
  }
}

mongoose.connection.on('error', error => {
  console.error('Ошибка соединения с MongoDB:', error.message);
});

module.exports = { connectMongoDB };
