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
        visit_number: Sequelize.TEXT,
        clinic_number: Sequelize.TEXT,
        date_visit: Sequelize.DATEONLY,
        counselled_on_fp: Sequelize.DATEONLY,
        fp_method: Sequelize.STRING,
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