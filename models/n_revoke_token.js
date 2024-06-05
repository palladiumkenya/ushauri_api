const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NToken = sequelize.sequelize.define(
    "tbl_nishauri_token", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user_id:Sequelize.INTEGER,
        token:Sequelize.STRING,
        status:Sequelize.ENUM('True', 'False'),
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_token"
    }
);
exports.NToken = NToken;