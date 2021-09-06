const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const masterFacility = sequelize.sequelize.define(
    'tbl_master_facility', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        code: Sequelize.INTEGER,
        name: Sequelize.STRING,
        reg_number: Sequelize.STRING,
        keph_level: Sequelize.STRING,
        facility_type: Sequelize.STRING,
        owner: Sequelize.STRING,
        regulatory_body: Sequelize.STRING,
        beds: Sequelize.INTEGER,
        cots: Sequelize.INTEGER,
        county_id: Sequelize.INTEGER,
        Sub_County_ID: Sequelize.INTEGER,
        ward_id: Sequelize.INTEGER,
        operational_status: Sequelize.STRING,
        Open_whole_day: Sequelize.STRING,
        Open_public_holidays: Sequelize.STRING,
        Open_weekends: Sequelize.STRING,
        Open_late_night: Sequelize.STRING,
        Service_names: Sequelize.STRING,
        Approved: Sequelize.STRING,
        Public_visible: Sequelize.STRING,
        Closed: Sequelize.STRING,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        lat: Sequelize.STRING,
        lng: Sequelize.STRING,
        ushauri_id: Sequelize.INTEGER,
        db_source: Sequelize.STRING
    }, {
        timestamps: false,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_master_facility"
    }
)
module.exports.masterFacility = masterFacility