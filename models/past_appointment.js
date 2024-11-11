const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const ENCRYPTION_KEY = "encryption_key";

const PastAppointments = sequelize.sequelize.define(
    "past_appointments_view", {
        appointment_id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: false
        },
        clinic_id: Sequelize.INTEGER,
        client_id: Sequelize.INTEGER,
        clinic_no: Sequelize.BLOB,
        client_name: Sequelize.BLOB,
        client_phone_no: Sequelize.BLOB,
        appointment_type: Sequelize.STRING,
        appntmnt_date: Sequelize.STRING,
        file_no: Sequelize.INTEGER,
        buddy_phone_no: Sequelize.BLOB,
        facility_id: Sequelize.INTEGER,
        user_phone_no: Sequelize.BLOB,
        id: Sequelize.INTEGER,
        user_clinic: Sequelize.INTEGER,
        other_appointment_type: Sequelize.STRING,
        created_at: Sequelize.STRING
    }, {
        hooks: {
			beforeCreate: async (user) => {
				if (user.clinic_no) {
					user.clinic_no = await PastAppointments.encryptData(user.clinic_no);
				}
                if (user.client_name) {
					user.client_name = await PastAppointments.encryptData(user.client_name);
				}
                if (user.client_phone_no) {
					user.client_phone_no = await PastAppointments.encryptData(user.client_phone_no);
				}
                if (user.buddy_phone_no) {
					user.buddy_phone_no = await PastAppointments.encryptData(user.buddy_phone_no);
				}
                if (user.user_phone_no) {
					user.user_phone_no = await PastAppointments.encryptData(user.user_phone_no);
				}
			},
			beforeUpdate: async (user) => {
				if (user.clinic_no) {
					user.clinic_no = await PastAppointments.encryptData(user.clinic_no);
				}
                if (user.client_name) {
					user.client_name = await PastAppointments.encryptData(user.client_name);
				}
                if (user.client_phone_no) {
					user.client_phone_no = await PastAppointments.encryptData(user.client_phone_no);
				}
                if (user.buddy_phone_no) {
					user.buddy_phone_no = await PastAppointments.encryptData(user.buddy_phone_no);
				}
                if (user.user_phone_no) {
					user.user_phone_no = await PastAppointments.encryptData(user.user_phone_no);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('clinic_no')) {
						const decryptedclinic_no= await PastAppointments.decryptData(user.getDataValue('clinic_no'));
						user.clinic_no = decryptedclinic_no;
					}
                    if (user.getDataValue('client_name')) {
						const decryptedclient_name= await PastAppointments.decryptData(user.getDataValue('client_name'));
						user.client_name = decryptedclient_name;
					}
                    if (user.getDataValue('client_phone_no')) {
						const decryptedclient_phone_no= await PastAppointments.decryptData(user.getDataValue('client_phone_no'));
						user.client_phone_no = decryptedclient_phone_no;
					}
                    if (user.getDataValue('buddy_phone_no')) {
						const decryptedbuddy_phone_no= await PastAppointments.decryptData(user.getDataValue('buddy_phone_no'));
						user.buddy_phone_no = decryptedbuddy_phone_no;
					}
                    if (user.getDataValue('user_phone_no')) {
						const decrypteduser_phone_no= await PastAppointments.decryptData(user.getDataValue('user_phone_no'));
						user.user_phone_no = decrypteduser_phone_no;
					}
				};

				if (Array.isArray(result)) {
					await Promise.all(result.map(decryptFields));
				} else if (result) {
					await decryptFields(result);
				}
			}
		},
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_past_appointment_new"
    }
);
// Encrypt method
PastAppointments.encryptData = async function(value) {
	if (value) {
		const encrypted = await sequelize.sequelize.query(
			`SELECT AES_ENCRYPT(?, ?) AS encrypted`,
			{
				replacements: [value, ENCRYPTION_KEY],
				type: Sequelize.QueryTypes.SELECT
			}
		);
		return encrypted[0].encrypted;
	}
	return null;
};

// Decrypt method
PastAppointments.decryptData = async function(encryptedValue) {
	if (encryptedValue) {
		const decrypted = await sequelize.sequelize.query(
			`SELECT CONVERT(AES_DECRYPT(?, ?) USING 'utf8') AS decrypted`,
			{
				replacements: [encryptedValue, ENCRYPTION_KEY],
				type: Sequelize.QueryTypes.SELECT
			}
		);
		return decrypted[0].decrypted || null;
	}
	return null;
};
exports.PastAppointments = PastAppointments;
