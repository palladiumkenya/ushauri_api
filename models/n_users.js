const sequelize = require("../db_config");
const { Sequelize, DataTypes } = require("sequelize");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const NUsers = sequelize.sequelize.define(
	"tbl_nishauri_users",
	{
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		password: Sequelize.STRING,
		last_login: Sequelize.STRING,
		first_name: {
             type:Sequelize.BLOB
        },
		last_name: {
            type:Sequelize.BLOB
       },
		msisdn: {
            type: Sequelize.BLOB,
        },
		email: {
			type: Sequelize.BLOB,
			allowNull: true,
		},
		is_active: Sequelize.STRING,
		date_joined: Sequelize.DATE,
		terms_accepted: Sequelize.BOOLEAN,
		language_preference: Sequelize.STRING,
		otp_number: Sequelize.STRING,
		otp_gen_date: Sequelize.DATEONLY,
		otp_gen_hour: Sequelize.TIME,
		profile_otp_number: Sequelize.STRING,
		profile_otp_date: Sequelize.DATEONLY,
		profile_status: Sequelize.STRING,
		refresh_token: Sequelize.STRING,
		app_version: Sequelize.STRING,
		chatbot_consent: Sequelize.STRING,
		chatbot_consent_date: Sequelize.DATE,
		fcm_token: Sequelize.STRING,
		role_id: Sequelize.INTEGER,
		facility_mflcode: Sequelize.INTEGER
	},
	{
		hooks: {
			beforeCreate: async (user) => {
				if (user.msisdn) {
					user.msisdn = await NUsers.encryptData(user.msisdn);
				}
				if (user.email) {
					user.email = await NUsers.encryptData(user.email);
				}
                if (user.first_name) {
					user.first_name = await NUsers.encryptData(user.first_name);
				}
                if (user.last_name) {
					user.last_name = await NUsers.encryptData(user.last_name);
				}
			},
			beforeUpdate: async (user) => {
				if (user.msisdn) {
					user.msisdn = await NUsers.encryptData(user.msisdn);
				}
				if (user.email) {
					user.email = await NUsers.encryptData(user.email);
				}
                if (user.first_name) {
					user.first_name = await NUsers.encryptData(user.first_name);
				}
                if (user.last_name) {
					user.last_name = await NUsers.encryptData(user.last_name);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('msisdn')) {
						const decryptedMsisdn = await NUsers.decryptData(user.getDataValue('msisdn'));
						user.msisdn = decryptedMsisdn;
					}
					if (user.getDataValue('email')) {
						const decryptedEmail = await NUsers.decryptData(user.getDataValue('email'));
						user.email = decryptedEmail;
					}
                    if (user.getDataValue('first_name')) {
						const decryptedfirst_name = await NUsers.decryptData(user.getDataValue('first_name'));
						user.first_name = decryptedfirst_name;
					}
                    if (user.getDataValue('last_name')) {
						const decryptedlast_name = await NUsers.decryptData(user.getDataValue('last_name'));
						user.last_name = decryptedlast_name;
					}
				};

				if (Array.isArray(result)) {
					await Promise.all(result.map(decryptFields));
				} else if (result) {
					await decryptFields(result);
				}
			}
		},
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName: true,
		tableName: "tbl_nishauri_users",
	}
);

// Encrypt method
NUsers.encryptData = async function(value) {
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
NUsers.decryptData = async function(encryptedValue) {
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

exports.NUsers = NUsers;
