const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const pmtct_hei = sequelize.sequelize.define(
    "tbl_pmtct_hei", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
       
        client_id: Sequelize.INTEGER,
       
         weight:Sequelize.STRING,
        height:Sequelize.STRING,
        height_category:Sequelize.STRING,
        muac:Sequelize.STRING,
        tb_screening:Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        infant_feeding:Sequelize.STRING,
        was_pcr_done:Sequelize.STRING,
        date_eid_sample:Sequelize.STRING,
        eid_test:Sequelize.STRING,
        pcr_result:Sequelize.STRING,
        confirm_pcr:Sequelize.STRING,
        visit_date:Sequelize.DATEONLY,
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
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_pmtct_hei"
    }
);
exports.pmtct_hei = pmtct_hei;