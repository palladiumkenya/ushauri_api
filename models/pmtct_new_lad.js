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
        anc_visits:Sequelize.TEXT,
        delivery_mode: Sequelize.TEXT,
        admission_date: Sequelize.DATEONLY,
        delivery_place: Sequelize.TEXT,
        delivery_outcome: Sequelize.TEXT,
        mother_condition: Sequelize.TEXT,
        date_death: Sequelize.DATEONLY,
        mother_current_regimen: Sequelize.STRING,
        weight: Sequelize.STRING,
        muac: Sequelize.STRING,
        delivery_hiv_status: Sequelize.STRING,
        is_hiv_tested: Sequelize.STRING,
        m_status: Sequelize.STRING,
        m_date_tested: Sequelize.DATEONLY,
        m_ccc_number: Sequelize.STRING,
        m_enrolment_date: Sequelize.DATEONLY,
        m_art_start_date: Sequelize.DATEONLY,
        m_regimen: Sequelize.STRING,
        p_status: Sequelize.STRING,
        p_date_tested: Sequelize.DATEONLY,
        p_ccc_number: Sequelize.STRING,
        p_enrolment_date: Sequelize.DATEONLY,
        p_art_start_date: Sequelize.DATEONLY,
        tb_outcome: Sequelize.STRING,
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
        is_syphyilis: Sequelize.STRING,
        syphilis_treatment: Sequelize.STRING,
        hepatitis_b: Sequelize.STRING,
        m_started_haart: Sequelize.STRING,
        m_on_haart_anc: Sequelize.STRING,
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