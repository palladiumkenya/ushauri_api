const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const {User} = require("./user");
const {
    Client
} = require("./client");

const TracerClients = sequelize.sequelize.define(
    "tbl_tracer_client",
    {
        id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        tracer_id: Sequelize.INTEGER,
        client_id: Sequelize.INTEGER,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        created_at: Sequelize.DATE,
        updated_at: Sequelize.DATE
    },
    {
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_tracer_client"
    }
);

TracerClients.belongsTo(User, {
    foreignKey: "tracer_id"
})
TracerClients.belongsTo(Client, {
    foreignKey: "client_id"
})

module.exports = TracerClients

