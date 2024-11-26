const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");
const {
    Appointment
} = require("./appointment");
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const Client = sequelize.sequelize.define(
    "tbl_client", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        group_id: Sequelize.INTEGER,
        language_id: Sequelize.INTEGER,
        clinic_number: {
            type: Sequelize.BLOB,
            unique: true,
            allowNull: false
        },
        f_name: Sequelize.BLOB,
        m_name: Sequelize.BLOB,
        l_name: Sequelize.BLOB,
        dob: Sequelize.BLOB,
        txt_frequency: Sequelize.NUMBER,
        txt_time: Sequelize.NUMBER,
        phone_no: Sequelize.BLOB,
        alt_phone_no: Sequelize.BLOB,
        buddy_phone_no: Sequelize.BLOB,
        shared_no_name: Sequelize.STRING,
        partner_id: Sequelize.INTEGER,
        mfl_code: {
            type: Sequelize.INTEGER,
            len: 5
        },
        status: Sequelize.ENUM(
            "Active",
            "Disabled",
            "Deceased",
            "Self Transfer",
            "Transfer Out",
            "LTFU"
        ),
        client_status: Sequelize.ENUM("ART", "Pre-Art", "On Care", "No Condition"),
        gender: Sequelize.NUMBER,
        marital: Sequelize.NUMBER,
        smsenable: Sequelize.ENUM("Yes", "No"),
        enrollment_date: Sequelize.DATEONLY,
        art_date: {
            type: Sequelize.DATEONLY,
            defaultValue: null,
            allowNull: true
        },
        wellness_enable: Sequelize.ENUM("Yes", "No"),
        motivational_enable: Sequelize.ENUM("Yes", "No"),
        welcome_sent: Sequelize.ENUM("Yes", "No"),
        client_type: Sequelize.ENUM("New", "Transfer"),
        consent_date: Sequelize.DATEONLY,
        physical_address: Sequelize.STRING,
        transfer_date: Sequelize.DATEONLY,
        entry_point: Sequelize.STRING,
        gods_number: Sequelize.STRING,
        date_deceased: Sequelize.DATEONLY,
        patient_source: Sequelize.STRING,
        prev_clinic: Sequelize.STRING,
        ushauri_id: Sequelize.INTEGER,
        db_source: Sequelize.STRING,
        clnd_dob: Sequelize.DATEONLY,
        clinic_id: Sequelize.INTEGER,
        national_id: Sequelize.BLOB,
        upi_no: Sequelize.BLOB,
        birth_cert_no: Sequelize.BLOB,
        file_no: Sequelize.STRING,
        locator_county: Sequelize.STRING,
        locator_sub_county: Sequelize.STRING,
        locator_ward: Sequelize.STRING,
        locator_location: Sequelize.STRING,
        locator_village: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        hei_no: Sequelize.BLOB,
        citizenship: Sequelize.INTEGER,
        county_birth: Sequelize.INTEGER,
        hiv_positive_date:Sequelize.DATEONLY,
        regimen:Sequelize.STRING,
        who_stage:Sequelize.STRING,
        prep_number:Sequelize.BLOB

    }, {
        hooks: {
			beforeCreate: async (user) => {
				if (user.clinic_number) {
					user.clinic_number = await Client.encryptData(user.clinic_number);
				}
				if (user.phone_no) {
					user.phone_no = await Client.encryptData(user.phone_no);
				}
                if (user.f_name) {
					user.f_name = await Client.encryptData(user.f_name);
				}
                if (user.m_name) {
					user.m_name = await Client.encryptData(user.m_name);
				}
                if (user.l_name) {
					user.l_name = await Client.encryptData(user.l_name);
				}
                if (user.dob) {
					user.dob = await Client.encryptData(user.dob);
				}
                if (user.national_id) {
					user.national_id = await Client.encryptData(user.national_id);
				}
                if (user.alt_phone_no) {
					user.alt_phone_no = await Client.encryptData(user.alt_phone_no);
				}
                if (user.buddy_phone_no) {
					user.buddy_phone_no = await Client.encryptData(user.buddy_phone_no);
				}
                if (user.upi_no) {
					user.upi_no = await Client.encryptData(user.upi_no);
				}
                if (user.birth_cert_no) {
					user.birth_cert_no = await Client.encryptData(user.birth_cert_no);
				}
                if (user.hei_no) {
					user.hei_no = await Client.encryptData(user.hei_no);
				}
                if (user.prep_number) {
					user.prep_number = await Client.encryptData(user.prep_number);
				}
			},
			beforeUpdate: async (user) => {
				if (user.clinic_number) {
					user.clinic_number = await Client.encryptData(user.clinic_number);
				}
				if (user.phone_no) {
					user.phone_no = await Client.encryptData(user.phone_no);
				}
                if (user.f_name) {
					user.f_name = await Client.encryptData(user.f_name);
				}
                if (user.m_name) {
					user.m_name = await Client.encryptData(user.m_name);
				}
                if (user.l_name) {
					user.l_name = await Client.encryptData(user.l_name);
				}
                if (user.dob) {
					user.dob = await Client.encryptData(user.dob);
				}
                if (user.national_id) {
					user.national_id = await Client.encryptData(user.national_id);
				}
                if (user.alt_phone_no) {
					user.alt_phone_no = await Client.encryptData(user.alt_phone_no);
				}
                if (user.buddy_phone_no) {
					user.buddy_phone_no = await Client.encryptData(user.buddy_phone_no);
				}
                if (user.upi_no) {
					user.upi_no = await Client.encryptData(user.upi_no);
				}
                if (user.birth_cert_no) {
					user.birth_cert_no = await Client.encryptData(user.birth_cert_no);
				}
                if (user.hei_no) {
					user.hei_no = await Client.encryptData(user.hei_no);
				}
                if (user.prep_number) {
					user.prep_number = await Client.encryptData(user.prep_number);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('clinic_number')) {
						const decryptedclinic_number = await Client.decryptData(user.getDataValue('clinic_number'));
						user.clinic_number = decryptedclinic_number;
					}
					if (user.getDataValue('phone_no')) {
						const decryptedphone_no = await Client.decryptData(user.getDataValue('phone_no'));
						user.phone_no = decryptedphone_no;
					}
                    if (user.getDataValue('f_name')) {
						const decryptedfirst_name = await Client.decryptData(user.getDataValue('f_name'));
						user.f_name = decryptedfirst_name;
					}
                    if (user.getDataValue('m_name')) {
						const decryptedm_name = await Client.decryptData(user.getDataValue('m_name'));
						user.m_name = decryptedm_name;
					}
                    if (user.getDataValue('l_name')) {
						const decryptedl_name = await Client.decryptData(user.getDataValue('l_name'));
						user.l_name = decryptedl_name;
					}
                    if (user.getDataValue('dob')) {
						const decrypteddob = await Client.decryptData(user.getDataValue('dob'));
						user.dob = decrypteddob;
					}
                    if (user.getDataValue('alt_phone_no')) {
						const decryptedalt_phone_no = await Client.decryptData(user.getDataValue('alt_phone_no'));
						user.alt_phone_no = decryptedalt_phone_no;
					}
                    if (user.getDataValue('national_id')) {
						const decryptednational_id = await Client.decryptData(user.getDataValue('national_id'));
						user.national_id = decryptednational_id;
					}
                    if (user.getDataValue('buddy_phone_no')) {
						const decryptedbuddy_phone_no = await Client.decryptData(user.getDataValue('buddy_phone_no'));
						user.buddy_phone_no = decryptedbuddy_phone_no;
					}
                    if (user.getDataValue('upi_no')) {
						const decryptedupi_no = await Client.decryptData(user.getDataValue('upi_no'));
						user.upi_no = decryptedupi_no;
					}
                    if (user.getDataValue('birth_cert_no')) {
						const decryptedbirth_cert_no = await Client.decryptData(user.getDataValue('birth_cert_no'));
						user.birth_cert_no = decryptedbirth_cert_no;
					}
                    if (user.getDataValue('hei_no')) {
						const decryptedhei_no = await Client.decryptData(user.getDataValue('hei_no'));
						user.hei_no = decryptedhei_no;
					}
                    if (user.getDataValue('prep_number')) {
						const decryptedprep_number = await Client.decryptData(user.getDataValue('prep_number'));
						user.prep_number = decryptedprep_number;
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
        tableName: "tbl_client"
    }
);

function validateClient(client) {
    const schema = {
        group_id: Joi.number(),
        mfl_code: Joi.number()
            .min(5)
            .max(5),
        clinic_number: Joi.number()
            .min(10)
            .max(10),
        file_no: Joi.string(),
        locator_county: Joi.string(),
        locator_sub_county: Joi.string(),
        locator_ward: Joi.string(),
        locator_village: Joi.string(),
        locator_location: Joi.string(),
        gender: Joi.number().required(),
        marital: Joi.number().required(),
        client_status: Joi.string().required(),
        enrollment_date: Joi.date().required(),
        art_date: Joi.date().required(),
        enable_sms: Joi.string().required(),
        status: Joi.string().required(),
        f_name: Joi.string()
            .min(3)
            .max(10)
            .required(),
        m_name: Joi.string()
            .min(3)
            .max(10),
        l_name: Joi.string()
            .min(3)
            .max(10)
            .required(),
        dob: Joi.date().required(),
        phone_no: Joi.string()
            .max(10)
            .min(10),
        clinic_id: Joi.number()
    };

    return Joi.validate(client, schema);
}

// Encrypt method
Client.encryptData = async function(value) {
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
Client.decryptData = async function(encryptedValue) {
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
exports.Client = Client;
exports.validateClient = validateClient;