const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const models = require('../models');
const { User, Product, Order, Genre } = models;

// Получение всех товаров
router.get('/products', async (req, res) => {
    try {
        const { genre_id, min_price, max_price } = req.query;
        const where = {};

        if (genre_id) {
            where.genre_id = parseInt(genre_id);
        }

        if (min_price || max_price) {
            where.price = {};
            if (min_price) where.price[Op.gte] = parseFloat(min_price);
            if (max_price) where.price[Op.lte] = parseFloat(max_price);
        }

        const products = await Product.findAll({
            where,
            include: [{
                model: Genre,
                as: 'genre',
                attributes: ['name']
            }],
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: products.map(product => ({
                id: product.id,
                name: product.name,
                author: product.author,
                price: parseFloat(product.price),
                quantity: product.quantity,
                genre_name: product.genre ? product.genre.name : 'Не указан'
            })),
            columns: ['ID', 'Название', 'Автор', 'Цена', 'Количество', 'Жанр']
        });
    } catch (error) {
        console.error('Ошибка получения товаров:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных товаров'
        });
    }
});

// Получение всех заказов
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name']
                },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['name']
                }
            ],
            order: [['orders_date', 'DESC']]
        });

        res.json({
            success: true,
            data: orders.map(order => ({
                id: order.id,
                user_name: order.user ? order.user.name : 'Удаленный пользователь',
                product_name: order.product ? order.product.name : 'Удаленный товар',
                count: order.count,
                orders_date: order.orders_date
            })),
            columns: ['ID заказа', 'Пользователь', 'Товар', 'Количество', 'Дата заказа']
        });
    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных заказов'
        });
    }
});

// Получение всех жанров
router.get('/genres', async (req, res) => {
    try {
        const genres = await Genre.findAll({
            order: [['id', 'ASC']]
        });

        res.json({
            success: true,
            data: genres.map(genre => ({
                id: genre.id,
                name: genre.name
            })),
            columns: ['ID', 'Название жанра']
        });
    } catch (error) {
        console.error('Ошибка получения жанров:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных жанров'
        });
    }
});

module.exports = router;