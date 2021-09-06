const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const usrOutgoing = sequelize.Sequelize.define(
    'tbl_usr_outgoing', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        destination: Sequelize.STRING,
        source: Sequelize.STRING,
        msg: Sequelize.TEXT,
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
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        tableName: 'tbl_usr_outgoing'
    }
)
module.exports.usrOutgoing = usrOutgoing