const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NProvider = sequelize.sequelize.define(
    "tbl_nishauri_provider", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        family_name:Sequelize.STRING,
        given_name:Sequelize.STRING,
        national_id:Sequelize.INTEGER,
        salutation:Sequelize.STRING,
        license_number:Sequelize.STRING,
        board_number:Sequelize.STRING,
        cadre:Sequelize.STRING,
        gender:Sequelize.STRING,
        facility_code:Sequelize.INTEGER,
        user_id:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_provider"
    }
);
exports.NProvider = NProvider;