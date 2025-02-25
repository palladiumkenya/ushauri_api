const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const CPMEncounter = sequelize.sequelize.define("tbl_nishauri_cpm_encounter", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    provider_id: {
      type: Sequelize.INTEGER,
    },
    location_id: {
      type: Sequelize.STRING,
    },
    encounter_date: {
      type: Sequelize.DATE,
    },
    notes: {
        type: Sequelize.STRING,
      },

  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_nishauri_cpm_encounter"
});

exports.CPMEncounter = CPMEncounter;