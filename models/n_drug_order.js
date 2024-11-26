const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const NDrugOrder = sequelize.sequelize.define(
    "tbl_nishauri_drug_order", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        program_identifier:Sequelize.INTEGER,
        appointment_id:Sequelize.INTEGER,
        event_id:Sequelize.INTEGER,
        order_type:Sequelize.STRING,
        delivery_address:Sequelize.STRING,
        delivery_lat:Sequelize.STRING,
        delivery_long:Sequelize.STRING,
        delivery_method:Sequelize.STRING,
        courier_service:Sequelize.INTEGER,
        delivery_person:Sequelize.STRING,
        delivery_person_id:Sequelize.STRING,
        delivery_person_contact:Sequelize.STRING,
        order_by:Sequelize.INTEGER,
        mode:Sequelize.STRING,
        delivery_pickup_time:Sequelize.DATE,
        client_phone_no:Sequelize.BLOB,
        status:Sequelize.ENUM('Pending','Approved','Fullfilled','Dispatched'),
        is_received:Sequelize.INTEGER,
        fullfilled_date:Sequelize.DATE,
        comment:Sequelize.STRING
    }, {
        hooks: {
			beforeCreate: async (user) => {
				if (user.client_phone_no) {
					user.client_phone_no = await NDrugOrder.encryptData(user.client_phone_no);
				}
			},
			beforeUpdate: async (user) => {
				if (user.client_phone_no) {
					user.client_phone_no = await NDrugOrder.encryptData(user.client_phone_no);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('client_phone_no')) {
						const decryptedclient_phone_no= await NDrugOrder.decryptData(user.getDataValue('client_phone_no'));
						user.client_phone_no = decryptedclient_phone_no;
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
        tableName: "tbl_nishauri_drug_order"
    }
);

// Encrypt method
NDrugOrder.encryptData = async function(value) {
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
NDrugOrder.decryptData = async function(encryptedValue) {
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
exports.NDrugOrder = NDrugOrder;