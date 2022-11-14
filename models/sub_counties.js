const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const SCounty = sequelize.sequelize.define(
    "tbl_sub_county_upi", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        value_upi: Sequelize.TEXT,
        county_id: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_sub_county_upi"
    }
);
exports.SCounty = SCounty;