const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const {
    Client
} = require('./client')

const PMTCTModule = sequelize.sequelize.define(
    "tbl_pmtct", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        client_id: Sequelize.INTEGER,
        hei_no: Sequelize.STRING,
        type_of_care: Sequelize.ENUM('Yes', 'No', 'Pregnant'),
        hei_gender: Sequelize.INTEGER,
        hei_dob: Sequelize.DATEONLY,
        hei_first_name: Sequelize.STRING,
        hei_middle_name: Sequelize.STRING,
        hei_last_name: Sequelize.STRING,
        pcr_week6: Sequelize.DATEONLY,
        pcr_month6: Sequelize.DATEONLY,
        pcr_month12: Sequelize.DATEONLY,
        appointment_date: Sequelize.DATEONLY,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        appointment_id: Sequelize.INTEGER,
        care_giver_id: Sequelize.INTEGER,
        date_confirmed_positive: Sequelize.DATEONLY

    }, {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_pmtct"
    }
)
PMTCTModule.belongsTo(Client, {
    foreignKey: 'client_id',
})
module.exports.PMTCTModule = PMTCTModule