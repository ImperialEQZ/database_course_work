const { DataTypes } = require('sequelize');
const sequelize = require('/config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    users_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    count: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orders_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'orders',
    timestamps: false
});

Order.associate = function(models) {
    Order.belongsTo(models.User, {
        foreignKey: 'users_id',
        as: 'user'
    });

    Order.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
    });
};

module.exports = Order;