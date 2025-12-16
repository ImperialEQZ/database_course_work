const { User } = require('../backend/models');
const bcrypt = require('bcryptjs');

exports.loginVulnerable = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Автоматически добавляем комментарий и корректируем запрос для UNION (error-based инъекция)
        let query;
        const lowerUsername = username.toLowerCase();

        if (lowerUsername.includes('union') || lowerUsername.includes('cast') || lowerUsername.includes('::enum')) {
            query = `SELECT * FROM users WHERE username = '${username}' -- `;
        } else {
            query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
        }

        console.log('Уязвимый SQL-запрос:');
        console.log(query);

        const [results] = await User.sequelize.query(query);

        if (results.length > 0) {
            const user = {
                id: results[0].id,
                name: results[0].name,
                role: results[0].role
            };
            req.session.user = user;
            return res.json({ success: true, message: 'Успешный вход', user });
        }

        res.status(401).json({ success: false, error: 'Неверные учетные данные' });
    } catch (error) {
        console.error('Ошибка в уязвимом запросе:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            sql: error.sql
        });
    }
};

exports.loginSecure = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Неверные учетные данные' });
        }

        // Проверяем пароль - сначала как открытый текст, затем как хеш
        let isPasswordValid = false;

        if (user.password === password) {
            isPasswordValid = true;
            // Хеширование пароля для будущих входов
            const salt = await bcrypt.genSalt(10);

            const hashedPassword = await bcrypt.hash(password, salt);

            await user.update({ password: hashedPassword });
            console.log(`Пароль пользователя ${username} успешно захеширован`);
        } else if (user.password.startsWith('$2a$')) {
            isPasswordValid = await bcrypt.compare(password, user.password);
        }

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, error: 'Неверные учетные данные' });
        }

        const userSession = {
            id: user.id,
            name: user.name,
            role: user.role
        };

        req.session.user = userSession;

        res.json({
            success: true,
            message: 'Успешный вход',
            user: userSession
        });
    } catch (error) {
        console.error('Ошибка в защищенном запросе:', error);
        res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Выход выполнен' });
};

exports.getCurrentUser = (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.status(401).json({ success: false, error: 'Пользователь не авторизован' });
    }
};