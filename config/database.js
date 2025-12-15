require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

// Проверка подключения
(async () => {
    try {
        await sequelize.authenticate();
        console.log(' Успешное подключение к базе данных PostgreSQL');
    } catch (error) {
        console.error('Ошибка: невозможно подключиться к базе данных:', error);
    }
})();

module.exports = sequelize;