const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const pmtct_pnc = sequelize.sequelize.define(
    "tbl_pmtct_pnc", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
       
        client_id: Sequelize.INTEGER,
        visit_number: Sequelize.TEXT,
        clinic_number: Sequelize.TEXT,
        date_visit: Sequelize.DATEONLY,
        counselled_on_fp: Sequelize.TEXT,
        fp_method: Sequelize.INTEGER,
        delivery_mode: Sequelize.INTEGER,
        place_delivery: Sequelize.INTEGER,
        mother_regimen: Sequelize.INTEGER,
        mother_regimen_other: Sequelize.TEXT,
        baby_immunization: Sequelize.INTEGER,
        mother_outcome: Sequelize.INTEGER,
        date_died: Sequelize.DATEONLY,
        cause_of_death: Sequelize.TEXT,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_pmtct_pnc"
    }
);
exports.pmtct_pnc = pmtct_pnc;