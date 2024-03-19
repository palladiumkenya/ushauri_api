const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

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
        client_phone_no:Sequelize.STRING
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_drug_order"
    }
);
exports.NDrugOrder = NDrugOrder;