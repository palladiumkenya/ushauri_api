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
        mother_regimen_other:Sequelize.STRING,
        anc_visits:Sequelize.STRING,
        pnc_hiv_status:Sequelize.STRING,
        m_tested_hiv:Sequelize.STRING,
        m_status:Sequelize.STRING,
        m_date_tested:Sequelize.DATEONLY,
        m_ccc_number:Sequelize.STRING,
        m_enrolment_date:Sequelize.DATEONLY,
        m_art_start_date:Sequelize.DATEONLY,
        p_status:Sequelize.STRING,
        p_date_tested:Sequelize.DATEONLY,
        p_ccc_number:Sequelize.STRING,
        p_enrolment_date:Sequelize.DATEONLY,
        p_art_start_date:Sequelize.DATEONLY,
        tb_outcome:Sequelize.STRING,
        infant_prophylaxis_azt:{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
        infant_prophylaxis_nvp:{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
        infant_prophylaxis_ctx:{
            type: Sequelize.BOOLEAN,
            defaultValue: false,
          },
        m_started_haart:Sequelize.STRING,
        m_on_haart_given:Sequelize.STRING,
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