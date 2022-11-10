const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Country = sequelize.sequelize.define(
    "tbl_country", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        code: Sequelize.TEXT,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_country"
    }
);
exports.Country = Country;