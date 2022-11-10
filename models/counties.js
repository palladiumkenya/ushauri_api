const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const County = sequelize.sequelize.define(
    "tbl_county", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        code: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_county"
    }
);
exports.County = County;