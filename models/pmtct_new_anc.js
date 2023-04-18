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
        weight:Sequelize.STRING,
        muac:Sequelize.STRING,
        hiv_testing_before_anc:Sequelize.STRING,
        is_hiv_tested:Sequelize.STRING,
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
        vl_result:Sequelize.STRING,
        vl_result_type:Sequelize.STRING,
        vl_test_date:Sequelize.DATEONLY,
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