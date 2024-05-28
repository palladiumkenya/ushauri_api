const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NChatLogs = sequelize.sequelize.define(
    "tbl_nishauri_chatbot_logs", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user_id:Sequelize.INTEGER,
        quiz:Sequelize.STRING,
        response:Sequelize.STRING,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_chatbot_logs"
    }
);
exports.NChatLogs = NChatLogs;