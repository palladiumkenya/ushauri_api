const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Message = sequelize.sequelize.define(
    "tbl_messages", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        message: Sequelize.TEXT,
        target_group: Sequelize.ENUM("All", "Adult", "Adolescent", "Male", "Female"),
        message_type_id: Sequelize.INTEGER,
        logic_flow: Sequelize.INTEGER,
        language_id: Sequelize.INTEGER,
        message_group_id: Sequelize.INTEGER,
        status: Sequelize.ENUM("Active", "In Active", "Disabled"),
        identifier: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_messages"
    }
);

exports.Message = Message;