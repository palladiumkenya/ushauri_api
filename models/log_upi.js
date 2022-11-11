const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Log_upi = sequelize.sequelize.define(
    "tbl_moh_upi_logs", {
        log_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        mfl_code: Sequelize.TEXT,
        response: Sequelize.TEXT,
        payload:Sequelize.TEXT,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_moh_upi_logs"
    }
);
exports.Log_upi = Log_upi;