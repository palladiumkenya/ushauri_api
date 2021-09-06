const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const OtherFinalOutcome = sequelize.sequelize.define(
    "tbl_other_final_outcome", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        outcome: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        client_outcome_id: Sequelize.INTEGER,
        appointment_id: Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_other_final_outcome"
    }
);

exports.OtherFinalOutcome = OtherFinalOutcome;