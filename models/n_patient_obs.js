const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NpatientObs = sequelize.sequelize.define(
    "tbl_nishauri_patient_observations", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        lab_data:Sequelize.JSON,
        patient_ob:Sequelize.JSON,
        user_id:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_patient_observations"
    }
);
exports.NpatientObs = NpatientObs;