const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NBmiLog= sequelize.sequelize.define(
    "tbl_nishauri_bmi_logs", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        weight:Sequelize.DOUBLE,
        height:Sequelize.DOUBLE,
        results:Sequelize.DOUBLE,
        user_id:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_bmi_logs"
    }
);
exports.NBmiLog = NBmiLog;