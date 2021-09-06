const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Incoming = sequelize.sequelize.define(
  "tbl_incoming",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    source: Sequelize.STRING,
    destination: Sequelize.STRING,
    msg: Sequelize.STRING,
    senttime: Sequelize.STRING,
    receivedtime: Sequelize.STRING,
    reference: Sequelize.STRING,
    processed: Sequelize.ENUM("Processed", "Not Processed"),
    status: Sequelize.ENUM("Active"),
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_incoming"
  }
);

exports.Incoming = Incoming;
