const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const clientOutcome = sequelize.sequelize.define(
  "tbl_clnt_outcome",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: Sequelize.INTEGER,
    appointment_id: Sequelize.INTEGER,
    outcome: Sequelize.INTEGER,
    tracer_name: Sequelize.STRING,
    tracing_type: Sequelize.INTEGER,
    tracing_date: Sequelize.DATE,
    app_status: Sequelize.STRING,
    fnl_outcome: Sequelize.INTEGER,
    return_date: Sequelize.DATEONLY,
    tracing_cost: Sequelize.DOUBLE,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_clnt_outcome"
  }
);
exports.clientOutcome = clientOutcome;
