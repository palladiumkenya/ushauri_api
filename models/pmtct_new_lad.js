const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const pmtct_lad = sequelize.sequelize.define(
    "tbl_pmtct_delivery", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
       
        client_id: Sequelize.INTEGER,
        delivery_mode: Sequelize.TEXT,
        admission_date: Sequelize.DATEONLY,
        delivery_place: Sequelize.TEXT,
        delivery_outcome: Sequelize.TEXT,
        mother_condition: Sequelize.TEXT,
        date_death: Sequelize.DATEONLY,
        mother_current_regimen: Sequelize.TEXT,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_pmtct_delivery"
    }
);
exports.pmtct_lad = pmtct_lad;