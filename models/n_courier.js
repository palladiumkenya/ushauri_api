const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NCourier= sequelize.sequelize.define(
    "tbl_nishauri_courier", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name:Sequelize.STRING
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_courier"
    }
);
exports.NCourier = NCourier;