const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NUserprograms = sequelize.sequelize.define(
    "tbl_nishauri_user_programs", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
      
        user_id:Sequelize.INTEGER,
        program_type:Sequelize.INTEGER,
        program_identifier:Sequelize.STRING,
        moh_upi_no:Sequelize.STRING,
        email:Sequelize.STRING,
        is_active:Sequelize.STRING,
        activation_date:Sequelize.DATE
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_user_programs"
    }
);
exports.NUserprograms = NUserprograms;