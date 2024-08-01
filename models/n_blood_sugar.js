const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NBloodSugar= sequelize.sequelize.define(
    "tbl_nishauri_blood_sugar", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        level:Sequelize.DOUBLE,
        condition:Sequelize.STRING,
        notes:Sequelize.STRING,
        user_id:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_blood_sugar"
    }
);
exports.NBloodSugar = NBloodSugar;