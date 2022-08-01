const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const ServerConfig = sequelize.sequelize.define(
  "tbl_server_config",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    stage: Sequelize.STRING,
    url: Sequelize.STRING
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_server_config"
  }
);

exports.ServerConfig = ServerConfig;
