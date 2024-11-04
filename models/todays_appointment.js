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
        hooks: {
            // Hook before creating
            beforeCreate: async (TodayAppointments) => {
                const ENCRYPTION_KEY = 'encryption_key';  // Define your encryption key

                // Encrypt clinic_no before saving
                if (TodayAppointments.clinic_no) {
                    const clinic_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:clinic_no, :ENCRYPTION_KEY) AS encrypted_clinic_no`,
                        {
                            replacements: { clinic_no: TodayAppointments.clinic_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.clinic_no = clinic_no_result[0].encrypted_clinic_no;  // Store encrypted value
                }

                // Encrypt client_name before saving
                if (TodayAppointments.client_name) {
                    const client_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:client_name, :ENCRYPTION_KEY) AS encrypted_client_name`,
                        {
                            replacements: { client_name: TodayAppointments.client_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.client_name = client_name_result[0].encrypted_client_name;  // Store encrypted value
                }

                // Encrypt client_phone_no before saving
                if (TodayAppointments.client_phone_no) {
                    const client_phone_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:client_phone_no, :ENCRYPTION_KEY) AS encrypted_client_phone_no`,
                        {
                            replacements: { client_phone_no: TodayAppointments.client_phone_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.client_phone_no = client_phone_no_result[0].encrypted_client_phone_no;  // Store encrypted value
                }
                // Encrypt buddy_phone_no before saving
                if (TodayAppointments.buddy_phone_no) {
                    const buddy_phone_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:buddy_phone_no, :ENCRYPTION_KEY) AS encrypted_buddy_phone_no`,
                        {
                            replacements: { buddy_phone_no: TodayAppointments.buddy_phone_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.buddy_phone_no = buddy_phone_no_result[0].encrypted_buddy_phone_no;  // Store encrypted value
                }
                // Encrypt user_phone_no before saving
                if (TodayAppointments.buddy_phone_no) {
                    const user_phone_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:user_phone_no, :ENCRYPTION_KEY) AS encrypted_user_phone_no`,
                        {
                            replacements: { user_phone_no: TodayAppointments.user_phone_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.user_phone_no = user_phone_no_result[0].encrypted_user_phone_no;  // Store encrypted value
                }
            },

            // Hook before updating
            beforeUpdate: async (TodayAppointments) => {
                const ENCRYPTION_KEY = 'encryption_key';  // Define your encryption key

                // Encrypt clinic_no if it was updated
                if (TodayAppointments.clinic_no) {
                    const clinic_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:clinic_no, :ENCRYPTION_KEY) AS encrypted_clinic_no`,
                        {
                            replacements: { clinic_no: TodayAppointments.clinic_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.clinic_no = clinic_no_result[0].encrypted_clinic_no;
                }

                // Encrypt client_name if it was updated
                if (TodayAppointments.client_name) {
                    const client_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:client_name, :ENCRYPTION_KEY) AS encrypted_client_name`,
                        {
                            replacements: { client_name: TodayAppointments.client_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.client_name = client_name_result[0].encrypted_client_name;
                }

                // Encrypt client_phone_no if it was updated
                if (TodayAppointments.client_phone_no) {
                    const client_phone_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:client_phone_no, :ENCRYPTION_KEY) AS encrypted_client_phone_no`,
                        {
                            replacements: { client_phone_no: TodayAppointments.client_phone_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.client_phone_no = client_phone_no_result[0].encrypted_client_phone_no;
                }
                // Encrypt buddy_phone_no if it was updated
                if (TodayAppointments.buddy_phone_no) {
                    const buddy_phone_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:buddy_phone_no, :ENCRYPTION_KEY) AS encrypted_buddy_phone_no`,
                        {
                            replacements: { buddy_phone_no: TodayAppointments.buddy_phone_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.buddy_phone_no = buddy_phone_no_result[0].encrypted_buddy_phone_no;
                }
                // Encrypt user_phone_no if it was updated
                if (TodayAppointments.user_phone_no) {
                    const user_phone_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:user_phone_no, :ENCRYPTION_KEY) AS encrypted_user_phone_no`,
                        {
                            replacements: { user_phone_no: TodayAppointments.user_phone_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    TodayAppointments.user_phone_no = user_phone_no_result[0].encrypted_user_phone_no;
                }

            }
        },
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_todays_appointment"
    }
);
exports.TodayAppointments = TodayAppointments;
