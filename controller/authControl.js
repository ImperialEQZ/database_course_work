const { User } = require('../backend/models');
// Хеширование паролей
const bcrypt = require('bcryptjs');

exports.loginVulnerable = async (req, res) => {
    const { username, password } = req.body;

    try {
        // уязвимый запрос (прямая подстановка пользовательского ввода)
        const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

        console.log(' Выполняется уязвимый SQL-запрос:');
        console.log(query);

        const [results] = await User.sequelize.query(query);

        if (results.length > 0) {
            req.session.user = results[0];
            return res.json({
                success: true,
                message: 'Успешный вход',
                user: {
                    id: results[0].id,
                    name: results[0].name,
                    role: results[0].role
                }
            });
        }

        res.status(401).json({ success: false, error: 'Неверные учетные данные' });
    } catch (error) {
        console.error(' Ошибка в уязвимом запросе:', error);
        // Для демонстрации error-based инъекции специально возврат ошибки СУБД
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.loginSecure = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Безопасный запрос (использование параметризованных запросов Sequelize библиотеки)
        const user = await User.findOne({
            where: { username, password },
            attributes: ['id', 'name', 'role']
        });

        if (user) {
            req.session.user = user;
            return res.json({
                success: true,
                message: 'Успешный вход',
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role
                }
            });
        }

        res.status(401).json({ success: false, error: 'Неверные учетные данные' });
    } catch (error) {
        console.error(' Ошибка в защищенном запросе:', error);
        // Безопасная обработка ошибки (не показываем детали СУБД)
        res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
    }
};
// Логика выхода
exports.logout = (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Выход выполнен' });
};
// Получение текущего пользователя и его роли
exports.getCurrentUser = (req, res) => {
    if (req.session.user) {
        res.json({
            success: true,
            user: {
                id: req.session.user.id,
                name: req.session.user.name,
                role: req.session.user.role
            }
        });
    } else {
        res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }
};