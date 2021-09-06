const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Transit = sequelize.sequelize.define(
  "tbl_transit_app",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: Sequelize.NUMBER,
    client_id_number: Sequelize.STRING,
    appointment_type_id: Sequelize.NUMBER,
    drugs_duration: Sequelize.STRING,
    no_of_drugs: Sequelize.NUMBER,
    ccc_number: Sequelize.NUMBER,
    transit_facility: Sequelize.NUMBER,
    processed: Sequelize.STRING,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_transit_app"
  }
);
exports.Transit = Transit;
