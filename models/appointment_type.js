const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");
const AppointmentType = sequelize.sequelize.define(
  "tbl_appointment_types",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: Sequelize.STRING,
    status: Sequelize.ENUM("Active", "Disabled"),
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_appointment_types"
  }
);
exports.AppointmentType = AppointmentType;
