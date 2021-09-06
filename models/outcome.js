const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Outcome = sequelize.sequelize.define(
  "tbl_outcome",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: Sequelize.STRING,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_outcome"
  }
);

exports.Outcome = Outcome;
