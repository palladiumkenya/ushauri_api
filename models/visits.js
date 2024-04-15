const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const Visit = sequelize.sequelize.define(
    "tbl_visits", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        client_id: Sequelize.INTEGER,
        is_scheduled: Sequelize.STRING,
        visit_type: Sequelize.STRING,
        other_visit_type: Sequelize.TEXT,
        weight:Sequelize.STRING,
        height:Sequelize.STRING,
        bmi:Sequelize.STRING,
        z_score:Sequelize.STRING,
        muac:Sequelize.STRING,
        blood_sugar:Sequelize.STRING,
        systolic_pressure:Sequelize.STRING,
        diastolic_pressure:Sequelize.STRING,
        is_chronic_illness:Sequelize.STRING,
        illness:Sequelize.STRING,
        other_illness:Sequelize.TEXT,
        ncd_status:Sequelize.STRING,
        current_regimen:Sequelize.STRING,
        who_stage:Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_visits"
    }
);

exports.Visit = Visit;