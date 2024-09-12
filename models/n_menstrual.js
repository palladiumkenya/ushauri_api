const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NMenstrual = sequelize.sequelize.define(
    "tbl_nishauri_menstrual", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        period_start:Sequelize.DATEONLY,
        period_end:Sequelize.DATEONLY,
        fertile_start:Sequelize.DATEONLY,
        fertile_end:Sequelize.DATEONLY,
        ovulation:Sequelize.DATEONLY,
        predicted_period_start:Sequelize.DATEONLY,
        predicted_period_end:Sequelize.DATEONLY,
        cycle_length:Sequelize.INTEGER,
        period_length:Sequelize.INTEGER,
        user_id:Sequelize.INTEGER,
        status:Sequelize.ENUM('Active','Deleted'),
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_menstrual"
    }
);
exports.NMenstrual = NMenstrual;