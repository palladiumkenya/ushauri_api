const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NBloodPressure= sequelize.sequelize.define(
    "tbl_nishauri_blood_pressure", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        systolic:Sequelize.DOUBLE,
        diastolic:Sequelize.DOUBLE,
        pulse_rate:Sequelize.DOUBLE,
        notes:Sequelize.STRING,
        user_id:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_blood_pressure"
    }
);
exports.NBloodPressure = NBloodPressure;