const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NFAQ = sequelize.sequelize.define(
    "tbl_nishauri_faq", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        question:Sequelize.STRING,
        answer:Sequelize.STRING,
        status:Sequelize.STRING,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_faq"
    }
);
exports.NFAQ = NFAQ;