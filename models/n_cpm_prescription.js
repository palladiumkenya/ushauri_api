const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const CPMPrescription = sequelize.sequelize.define("tbl_nishauri_cpm_prescription", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    drug_name: {
      type: Sequelize.STRING,
    },
    unit: {
      type: Sequelize.STRING,
    },
    duration: {
      type: Sequelize.INTEGER,
    },
    medicine_time: {
      type: Sequelize.STRING,
    },
    to_be_taken: {
      type: Sequelize.STRING,
    },
    prescription_notes: {
      type: Sequelize.STRING,
    },
    appointment_id: {
      type: Sequelize.INTEGER,
    },
  },
  {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_nishauri_cpm_prescription"
});

exports.CPMPrescription = CPMPrescription;