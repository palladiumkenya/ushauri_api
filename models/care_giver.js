const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const CareGiver = sequelize.sequelize.define(
    "tbl_caregiver_not_on_care", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        care_giver_fname: Sequelize.STRING,
        care_giver_mname: Sequelize.STRING,
        care_giver_lname: Sequelize.STRING,
        care_giver_gender: Sequelize.INTEGER,
        care_giver_phone_number: Sequelize.STRING,
        hei_no: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,


    }, {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_caregiver_not_on_care"
    }
)
module.exports.CareGiver = CareGiver