const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const Nroles = sequelize.sequelize.define(
    "tbl_nishauri_roles", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        role_name:Sequelize.STRING,
        status:Sequelize.ENUM('Active', 'Inactive')
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_roles"
    }
);
exports.Nroles = Nroles;