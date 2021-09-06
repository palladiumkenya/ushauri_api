const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Clinic = sequelize.sequelize.define(
    "tbl_clinic", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        status: Sequelize.TEXT,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_clinic"
    }
);
exports.Clinic = Clinic;