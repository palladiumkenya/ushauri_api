const sequelize = require('../db_config')
const Sequelize = require("sequelize")

const ENCRYPTION_KEY = "encryption_key";
const Outgoing = sequelize.sequelize.define(
    'tbl_usr_outgoing', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        destination: Sequelize.BLOB,
        source: Sequelize.STRING,
        msg: Sequelize.STRING,
        status: Sequelize.ENUM('Sent', 'Not Sent'),
        responded: Sequelize.ENUM('Yes', 'No', 'Other'),
        message_type_id: Sequelize.INTEGER,
        content_id: Sequelize.INTEGER,
        clnt_usr_id: Sequelize.INTEGER,
        recepient_type: Sequelize.ENUM('Client', 'User'),
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        is_deleted: Sequelize.ENUM('1', '0'),
        outgoing_id: Sequelize.INTEGER,
        ushauri_id: Sequelize.INTEGER,
        db_source: Sequelize.INTEGER,
        messageId: Sequelize.STRING
    }, {
        hooks: {
			beforeCreate: async (user) => {
				if (user.destination) {
					user.destination = await Outgoing.encryptData(user.destination);
				}
			},
			beforeUpdate: async (user) => {
				if (user.destination) {
					user.destination = await Outgoing.encryptData(user.destination);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('destination')) {
						const decrypteddestination = await Outgoing.decryptData(user.getDataValue('destination'));
						user.destination = decrypteddestination;
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
        tableName: "tbl_usr_outgoing"
    }
);
// Encrypt method
Outgoing.encryptData = async function(value) {
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
Outgoing.decryptData = async function(encryptedValue) {
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
exports.Outgoing = Outgoing