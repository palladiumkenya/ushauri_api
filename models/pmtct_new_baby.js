const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const pmtct_baby = sequelize.sequelize.define(
    "tbl_pmtct_babies", {
        delivery_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
       
        delivery_id: Sequelize.INTEGER,
        baby_delivered: Sequelize.STRING,
        date_died: Sequelize.DATEONLY,
        cause_of_death: Sequelize.STRING,
        baby_sex: Sequelize.STRING,
        prophylaxix_date: Sequelize.DATEONLY,
        prophylaxis: Sequelize.STRING,
        date_birth : Sequelize.DATEONLY,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        baby_no: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_pmtct_babies"
    }
);
exports.pmtct_baby = pmtct_baby;