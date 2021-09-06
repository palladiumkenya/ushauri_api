const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Language = sequelize.sequelize.define(
    "tbl_language", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        status: Sequelize.TEXT,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_language"
    }
);
exports.Language = Language;