const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NLogs = sequelize.sequelize.define(
    "tbl_nishauri_logs", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
      
        user_id:Sequelize.INTEGER,
        access:Sequelize.STRING,     
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_logs"
    }
);
exports.NLogs = NLogs;