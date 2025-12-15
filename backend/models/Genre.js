const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Genre = sequelize.define('Genre', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'genres',
    timestamps: false
});

Genre.associate = function(models) {
    Genre.hasMany(models.Product, {
        foreignKey: 'genre_id',
        as: 'products'
    });
};

module.exports = Genre;