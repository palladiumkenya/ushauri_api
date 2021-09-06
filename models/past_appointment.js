const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const PastAppointments = sequelize.sequelize.define(
    "past_appointments_view", {
        appointment_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: false
        },
        clinic_id: Sequelize.INTEGER,
        client_id: Sequelize.INTEGER,
        clinic_no: Sequelize.INTEGER,
        client_name: Sequelize.STRING,
        client_phone_no: Sequelize.STRING,
        appointment_type: Sequelize.STRING,
        appntmnt_date: Sequelize.STRING,
        file_no: Sequelize.INTEGER,
        buddy_phone_no: Sequelize.STRING,
        facility_id: Sequelize.INTEGER,
        user_phone_no: Sequelize.STRING,
        id: Sequelize.INTEGER,
        user_clinic: Sequelize.INTEGER,
        other_appointment_type: Sequelize.STRING,
        created_at: Sequelize.STRING
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_past_appointment_new"
    }
);
exports.PastAppointments = PastAppointments;
