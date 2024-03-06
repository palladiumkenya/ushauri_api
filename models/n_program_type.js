const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NprogramTypes = sequelize.sequelize.define(
    "tbl_nishauri_program_type", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name:Sequelize.STRING,
        program_code:Sequelize.STRING,
        description:Sequelize.STRING,
        is_active:Sequelize.STRING
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_program_type"
    }
);
exports.NprogramTypes = NprogramTypes;