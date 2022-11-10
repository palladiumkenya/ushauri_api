const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const SCounty = sequelize.sequelize.define(
    "tbl_sub_county", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        county_id: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_sub_county"
    }
);
exports.SCounty = SCounty;