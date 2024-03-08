const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NUserProfile = sequelize.sequelize.define(
    "tbl_nishauri_user_profile", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user_id:Sequelize.INTEGER,
        f_name:Sequelize.STRING,
        l_name:Sequelize.STRING,
        email:Sequelize.STRING,
        phone_no:Sequelize.STRING,
        dob:Sequelize.DATEONLY,
        gender:Sequelize.STRING,
        landmark:Sequelize.STRING,
        blood_group: Sequelize.STRING,
        weight:Sequelize.STRING,
        height:Sequelize.STRING,
        marital: Sequelize.STRING,
        education: Sequelize.STRING,
        primary_language: Sequelize.STRING,
        occupation: Sequelize.STRING,
        allergies: Sequelize.STRING,
        chronics: Sequelize.STRING,
        disabilities: Sequelize.STRING

    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_user_profile"
    }
);
exports.NUserProfile = NUserProfile;