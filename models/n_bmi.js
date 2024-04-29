const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NBmi= sequelize.sequelize.define(
    "tbl_nishauri_bmi", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        status:Sequelize.STRING,
        description:Sequelize.STRING,
        is_active:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_bmi"
    }
);
exports.NBmi = NBmi;