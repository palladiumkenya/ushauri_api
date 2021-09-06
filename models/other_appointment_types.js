const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const OtherAppointmentType = sequelize.sequelize.define(
  "tbl_other_appointment_types",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: Sequelize.STRING,
    appointment_id: Sequelize.INTEGER,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_other_appointment_types"
  }
);

exports.OtherAppointmentType = OtherAppointmentType;
