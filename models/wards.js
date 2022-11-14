const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Ward = sequelize.sequelize.define(
    "tbl_ward_upi", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        value_upi: Sequelize.TEXT,
        scounty_id: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_ward_upi"
    }
);
exports.Ward = Ward;