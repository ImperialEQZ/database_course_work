require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const sequelize = require('./config/database');

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Статические файлы
app.use(express.static(path.join(__dirname, 'frontend')));

// API маршруты
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api', require('./backend/routes/api'));

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка ошибки: не найдено
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Маршрут не найден'
    });
});

// Синхронизация моделей
const syncModels = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Все модели успешно синхронизированы с базой данных');
    } catch (err) {
        console.error('Ошибка синхронизации моделей:', err);
    }
};

// Запуск сервера после синхронизации
syncModels().then(() => {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
        console.log(`API доступно по адресу: http://localhost:${PORT}/api`);
    });
});

// Обработка закрытия приложения
process.on('SIGINT', async () => {
    try {
        await sequelize.close();
        console.log(' Соединение с базой данных закрыто');
        process.exit(0);
    } catch (error) {
        console.error(' Ошибка закрытия соединения:', error);
        process.exit(1);
    }
});