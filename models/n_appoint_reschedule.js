const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const Napptreschedule = sequelize.sequelize.define(
    "tbl_nishauri_appoinment_reschedule", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
      
        appointment_id:Sequelize.INTEGER,
        reason_type:Sequelize.INTEGER,
        status:Sequelize.INTEGER,
        reason:Sequelize.STRING,
        request_date:Sequelize.DATE,
        proposed_date:Sequelize.DATE,
        process_date:Sequelize.DATE,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_appoinment_reschedule"
    }
);
exports.Napptreschedule = Napptreschedule;