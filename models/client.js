const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");
const {
    Appointment
} = require("./appointment");
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
            type: Sequelize.NUMBER,
            unique: true,
            allowNull: false,
            len: 10
        },
        f_name: Sequelize.STRING,
        m_name: Sequelize.STRING,
        l_name: Sequelize.STRING,
        dob: Sequelize.DATEONLY,
        txt_frequency: Sequelize.NUMBER,
        txt_time: Sequelize.NUMBER,
        phone_no: Sequelize.STRING,
        alt_phone_no: Sequelize.STRING,
        buddy_phone_no: Sequelize.STRING,
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
        national_id: Sequelize.STRING,
        upi_no: Sequelize.STRING,
        birth_cert_no: Sequelize.STRING,
        file_no: Sequelize.STRING,
        locator_county: Sequelize.STRING,
        locator_sub_county: Sequelize.STRING,
        locator_ward: Sequelize.STRING,
        locator_location: Sequelize.STRING,
        locator_village: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        hei_no: Sequelize.STRING
    }, {
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
exports.Client = Client;
exports.validateClient = validateClient;