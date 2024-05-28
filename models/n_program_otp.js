const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NprogramOTP = sequelize.sequelize.define(
    "tbl_nishauri_program_otp", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user_id:Sequelize.INTEGER,
        program_id:Sequelize.INTEGER,
        program_otp:Sequelize.STRING,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_program_otp"
    }
);
exports.NprogramOTP = NprogramOTP;