const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NUsers = sequelize.sequelize.define(
    "tbl_nishauri_users", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
      
        password:Sequelize.STRING,
        last_login:Sequelize.STRING,
        first_name:Sequelize.STRING,
        last_name:Sequelize.STRING,
        email:Sequelize.STRING,
        is_active:Sequelize.STRING,
        date_joined:Sequelize.DATE,
        msisdn:Sequelize.STRING,
        terms_accepted:Sequelize.BOOLEAN,
        language_preference:Sequelize.STRING,
        otp_number:Sequelize.STRING,
        otp_gen_date:Sequelize.DATEONLY,
        otp_gen_hour: Sequelize.TIME
        
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_users"
    }
);
exports.NUsers = NUsers;