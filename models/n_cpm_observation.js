const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const CPMObservation = sequelize.sequelize.define("tbl_nishauri_cpm_observation", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    encounter_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    question: {
      type: Sequelize.STRING,
    },
    answer: {
      type: Sequelize.STRING,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_nishauri_cpm_observation"
});

exports.CPMObservation = CPMObservation;