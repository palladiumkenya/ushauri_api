const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const NProvider = sequelize.sequelize.define(
    "tbl_nishauri_provider",
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        family_name: Sequelize.BLOB,
        given_name: Sequelize.BLOB,
        national_id: Sequelize.BLOB,

        salutation: Sequelize.STRING,
        license_number: Sequelize.BLOB,
        board_number: Sequelize.BLOB,
        cadre: Sequelize.STRING,
        gender: Sequelize.BLOB,
        facility_code: Sequelize.INTEGER,
        user_id: Sequelize.INTEGER,
    },
    {
        hooks: {
			beforeCreate: async (user) => {
				if (user.family_name) {
					user.family_name = await NProvider.encryptData(user.family_name);
				}
				if (user.given_name) {
					user.given_name = await NProvider.encryptData(user.given_name);
				}
                if (user.national_id) {
					user.national_id = await NProvider.encryptData(user.national_id);
				}
                if (user.license_number) {
					user.license_number = await NProvider.encryptData(user.license_number);
				}
                if (user.board_number) {
					user.board_number = await NProvider.encryptData(user.board_number);
				}
                if (user.gender) {
					user.gender = await NProvider.encryptData(user.gender);
				}
			},
			beforeUpdate: async (user) => {
				if (user.family_name) {
					user.family_name = await NProvider.encryptData(user.family_name);
                    user.changed('family_name', true);
				}
				if (user.given_name) {
					user.given_name = await NProvider.encryptData(user.given_name);
                    user.changed('given_name', true);
				}
                if (user.national_id) {
					user.national_id = await NProvider.encryptData(user.national_id);
                    user.changed('national_id', true);
				}
                if (user.license_number) {
					user.license_number = await NProvider.encryptData(user.license_number);
                    user.changed('license_number', true);
				}
                if (user.board_number) {
					user.board_number = await NProvider.encryptData(user.board_number);
                    user.changed('board_number', true);
				}
                if (user.gender) {
					user.gender = await NProvider.encryptData(user.gender);
                    user.changed('gender', true);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('family_name')) {
						const decryptedfamily_name = await NProvider.decryptData(user.getDataValue('family_name'));
						user.family_name = decryptedfamily_name;
					}
					if (user.getDataValue('given_name')) {
						const decryptedgiven_name = await NProvider.decryptData(user.getDataValue('given_name'));
						user.given_name = decryptedgiven_name;
					}
                    if (user.getDataValue('first_name')) {
						const decryptedfirst_name = await NProvider.decryptData(user.getDataValue('first_name'));
						user.first_name = decryptedfirst_name;
					}
                    if (user.getDataValue('national_id')) {
						const decryptednational_id = await NProvider.decryptData(user.getDataValue('national_id'));
						user.national_id = decryptednational_id;
					}
                    if (user.getDataValue('license_number')) {
						const decryptedlicense_number = await NProvider.decryptData(user.getDataValue('license_number'));
						user.license_number = decryptedlicense_number;
					}
                    if (user.getDataValue('board_number')) {
						const decryptedboard_number = await NProvider.decryptData(user.getDataValue('board_number'));
						user.board_number = decryptedboard_number;
					}
                    if (user.getDataValue('gender')) {
						const decryptedgender = await NProvider.decryptData(user.getDataValue('gender'));
						user.gender = decryptedgender;
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
        tableName: "tbl_nishauri_provider",
    }
);


// Encrypt method
NProvider.encryptData = async function(value) {
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
NProvider.decryptData = async function(encryptedValue) {
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

exports.NProvider = NProvider;


