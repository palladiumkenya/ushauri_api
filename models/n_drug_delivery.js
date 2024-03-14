const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NDrugDelivery = sequelize.sequelize.define(
    "tbl_nishauri_drug_delivery", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        program_identifier:Sequelize.INTEGER,
        order_id:Sequelize.INTEGER,
        initiated_by:Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_drug_delivery"
    }
);
exports.NDrugDelivery = NDrugDelivery;