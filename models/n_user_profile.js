const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");
const { encrypt, decrypt } = require('../routes/encrypt_service');

const ENCRYPTION_KEY = "encryption_key";

const NUserProfile = sequelize.sequelize.define(
    "tbl_nishauri_user_profile", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user_id:Sequelize.INTEGER,
        f_name:Sequelize.BLOB,
        l_name:Sequelize.BLOB,
        email:Sequelize.BLOB,
        phone_no:Sequelize.BLOB,
        dob:Sequelize.BLOB,
        gender:Sequelize.BLOB,
        landmark:Sequelize.STRING,
        blood_group: Sequelize.STRING,
        weight:Sequelize.STRING,
        height:Sequelize.STRING,
        marital: Sequelize.STRING,
        education: Sequelize.STRING,
        primary_language: Sequelize.STRING,
        occupation: Sequelize.STRING,
        allergies: Sequelize.STRING,
        chronics: Sequelize.STRING,
        disabilities: Sequelize.STRING,
        national_id: Sequelize.BLOB

    },
    {
        hooks: {
			beforeCreate: async (user) => {
				if (user.phone_no) {
					user.phone_no = await NUserProfile.encryptData(user.phone_no);
				}
				if (user.email) {
					user.email = await NUserProfile.encryptData(user.email);
				}
                if (user.f_name) {
					user.f_name = await NUserProfile.encryptData(user.f_name);
				}
                if (user.l_name) {
					user.l_name = await NUserProfile.encryptData(user.l_name);
				}
                if (user.dob) {
					user.dob = await NUserProfile.encryptData(user.dob);
				}
                if (user.national_id) {
					user.national_id = await NUserProfile.encryptData(user.national_id);
				}
                if (user.gender) {
					user.gender = await NUserProfile.encryptData(user.gender);
				}
			},
			beforeUpdate: async (user) => {
				if (user.phone_no) {
					user.phone_no = await NUserProfile.encryptData(user.phone_no);
				}
				if (user.email) {
					user.email = await NUserProfile.encryptData(user.email);
				}
                if (user.f_name) {
					user.f_name = await NUserProfile.encryptData(user.f_name);
				}
                if (user.l_name) {
					user.l_name = await NUserProfile.encryptData(user.l_name);
				}
                if (user.dob) {
					user.dob = await NUserProfile.encryptData(user.dob);
				}
                if (user.national_id) {
					user.national_id = await NUserProfile.encryptData(user.national_id);
				}
                if (user.gender) {
					user.gender = await NUserProfile.encryptData(user.gender);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('phone_no')) {
						const decryptedMsisdn = await NUserProfile.decryptData(user.getDataValue('phone_no'));
						user.phone_no = decryptedMsisdn;
					}
					if (user.getDataValue('email')) {
						const decryptedEmail = await NUserProfile.decryptData(user.getDataValue('email'));
						user.email = decryptedEmail;
					}
                    if (user.getDataValue('f_name')) {
						const decryptedfirst_name = await NUserProfile.decryptData(user.getDataValue('f_name'));
						user.f_name = decryptedfirst_name;
					}
                    if (user.getDataValue('l_name')) {
						const decryptedlast_name = await NUserProfile.decryptData(user.getDataValue('l_name'));
						user.l_name = decryptedlast_name;
					}
                    if (user.getDataValue('dob')) {
						const decrypteddob = await NUserProfile.decryptData(user.getDataValue('dob'));
						user.dob = decrypteddob;
					}
                    if (user.getDataValue('gender')) {
						const decryptedgender = await NUserProfile.decryptData(user.getDataValue('gender'));
						user.gender = decryptedgender;
					}
                    if (user.getDataValue('national_id')) {
						const decryptednational_id = await NUserProfile.decryptData(user.getDataValue('national_id'));
						user.gender = decryptednational_id;
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
            tableName: "tbl_nishauri_user_profile"
    },

);

// Encrypt method
NUserProfile.encryptData = async function(value) {
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
NUserProfile.decryptData = async function(encryptedValue) {
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
exports.NUserProfile = NUserProfile;