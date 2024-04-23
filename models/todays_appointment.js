const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const TodayAppointments = sequelize.sequelize.define(
    "todays_appointments", {
        appointment_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: false
        },
        clinic_id: Sequelize.INTEGER,
        clinic_no: Sequelize.INTEGER,
        client_name: Sequelize.STRING,
        appointment_kept: Sequelize.STRING,
        client_phone_no: Sequelize.STRING,
        appointment_type: Sequelize.STRING,
        appntmnt_date: Sequelize.STRING,
        file_no: Sequelize.INTEGER,
        buddy_phone_no: Sequelize.STRING,
        facility_id: Sequelize.INTEGER,
        user_phone_no: Sequelize.STRING,
        client_id: Sequelize.INTEGER,
        created_at: Sequelize.STRING

    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_todays_appointment"
    }
);
exports.TodayAppointments = TodayAppointments;
