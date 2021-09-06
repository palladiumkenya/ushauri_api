const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Broadcast = sequelize.sequelize.define(
    "tbl_broadcast", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: Sequelize.TEXT,
        description: Sequelize.TEXT,
        status: Sequelize.TEXT,
        is_approved: {
            type: Sequelize.TEXT,
            defaultValue: true,
        },
        mfl_code: Sequelize.INTEGER,
        partner_id: Sequelize.INTEGER,
        message: Sequelize.TEXT,
        broadcast_date: Sequelize.DATEONLY,
        county_id: Sequelize.INTEGER,
        sub_county_id: Sequelize.INTEGER,
        reason: Sequelize.TEXT,
        msg: Sequelize.TEXT,
        target_group: Sequelize.INTEGER,
        group_id: Sequelize.INTEGER,
        time_id: Sequelize.INTEGER,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER

    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_broadcast"
    }
);
exports.Broadcast = Broadcast;