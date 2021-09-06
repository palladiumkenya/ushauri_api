const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Partner = sequelize.sequelize.define(
    "tbl_partner", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        partner_type_id: Sequelize.INTEGER,
        phone_no: Sequelize.TEXT,
        location: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_partner"
    }
);
exports.Partner = Partner;