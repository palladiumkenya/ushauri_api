const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const pmtct_anc = sequelize.sequelize.define(
    "tbl_pmtct_anc", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
       
        client_id: Sequelize.INTEGER,
        visit_number: Sequelize.TEXT,
        clinic_number: Sequelize.TEXT,
        client_type: Sequelize.STRING,
        parity_one: Sequelize.STRING,
        parity_two: Sequelize.STRING,
        gravida: Sequelize.STRING,
        lmp_date: Sequelize.DATEONLY,
        edd: Sequelize.DATEONLY,
        is_syphyilis: Sequelize.STRING,
        syphilis_treatment: Sequelize.STRING,
        gestation:Sequelize.STRING,
        hepatitis_b: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_pmtct_anc"
    }
);
exports.pmtct_anc = pmtct_anc;