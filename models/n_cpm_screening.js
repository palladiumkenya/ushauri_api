const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const ScreeningForm = sequelize.sequelize.define("tbl_nishauri_cpm_screening", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
    },
    version: {
      type: Sequelize.STRING,
    },
    published: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    uuid: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    retired: {
      type: Sequelize.BOOLEAN,
    },
    encounter: {
      type: Sequelize.STRING,
    },
    json_data: {
      type: Sequelize.JSON,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_nishauri_cpm_screening"
});

exports.ScreeningForm = ScreeningForm;