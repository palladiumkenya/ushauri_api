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
        hooks: {
            // Hook before creating
            beforeCreate: async (PMTCTModule) => {
                const ENCRYPTION_KEY = 'encryption_key';  // Define your encryption key

                // Encrypt hei_no before saving
                if (PMTCTModule.hei_no) {
                    const hei_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_no, :ENCRYPTION_KEY) AS encrypted_hei_no`,
                        {
                            replacements: { hei_no: PMTCTModule.hei_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_no = hei_no_result[0].encrypted_hei_no;  // Store encrypted value
                }

                // Encrypt hei_dob before saving
                if (PMTCTModule.hei_dob) {
                    const hei_dob_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_dob, :ENCRYPTION_KEY) AS encrypted_hei_dob`,
                        {
                            replacements: { hei_dob: PMTCTModule.hei_dob.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_dob = hei_dob_result[0].encrypted_hei_dob;  // Store encrypted value
                }

                // Encrypt hei_first_name before saving
                if (PMTCTModule.hei_first_name) {
                    const hei_first_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_first_name, :ENCRYPTION_KEY) AS encrypted_hei_first_name`,
                        {
                            replacements: { hei_first_name: PMTCTModule.hei_first_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_first_name = hei_first_name_result[0].encrypted_hei_first_name;  // Store encrypted value
                }
                // Encrypt hei_middle_name before saving
                if (PMTCTModule.hei_middle_name) {
                    const hei_middle_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_middle_name, :ENCRYPTION_KEY) AS encrypted_hei_middle_name`,
                        {
                            replacements: { hei_middle_name: PMTCTModule.hei_middle_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_middle_name = hei_middle_name_result[0].encrypted_hei_middle_name;  // Store encrypted value
                }
                // Encrypt hei_last_name before saving
                if (PMTCTModule.hei_middle_name) {
                    const hei_last_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_last_name, :ENCRYPTION_KEY) AS encrypted_hei_last_name`,
                        {
                            replacements: { hei_last_name: PMTCTModule.hei_last_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_last_name = hei_last_name_result[0].encrypted_hei_last_name;  // Store encrypted value
                }
            },

            // Hook before updating
            beforeUpdate: async (PMTCTModule) => {
                const ENCRYPTION_KEY = 'encryption_key';  // Define your encryption key

                // Encrypt hei_no if it was updated
                if (PMTCTModule.hei_no) {
                    const hei_no_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_no, :ENCRYPTION_KEY) AS encrypted_hei_no`,
                        {
                            replacements: { hei_no: PMTCTModule.hei_no.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_no = hei_no_result[0].encrypted_hei_no;
                }

                // Encrypt hei_dob if it was updated
                if (PMTCTModule.hei_dob) {
                    const hei_dob_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_dob, :ENCRYPTION_KEY) AS encrypted_hei_dob`,
                        {
                            replacements: { hei_dob: PMTCTModule.hei_dob.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_dob = hei_dob_result[0].encrypted_hei_dob;
                }

                // Encrypt hei_first_name if it was updated
                if (PMTCTModule.hei_first_name) {
                    const hei_first_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_first_name, :ENCRYPTION_KEY) AS encrypted_hei_first_name`,
                        {
                            replacements: { hei_first_name: PMTCTModule.hei_first_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_first_name = hei_first_name_result[0].encrypted_hei_first_name;
                }
                // Encrypt hei_middle_name if it was updated
                if (PMTCTModule.hei_middle_name) {
                    const hei_middle_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_middle_name, :ENCRYPTION_KEY) AS encrypted_hei_middle_name`,
                        {
                            replacements: { hei_middle_name: PMTCTModule.hei_middle_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_middle_name = hei_middle_name_result[0].encrypted_hei_middle_name;
                }
                // Encrypt hei_last_name if it was updated
                if (PMTCTModule.hei_last_name) {
                    const hei_last_name_result = await sequelize.sequelize.query(
                        `SELECT AES_ENCRYPT(:hei_last_name, :ENCRYPTION_KEY) AS encrypted_hei_last_name`,
                        {
                            replacements: { hei_last_name: PMTCTModule.hei_last_name.toString(), ENCRYPTION_KEY },
                            type: Sequelize.QueryTypes.SELECT
                        }
                    );
                    PMTCTModule.hei_last_name = hei_last_name_result[0].encrypted_hei_last_name;
                }

            }
        },

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