const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const {
    Client
} = require('./client')
const DFCModulue = sequelize.sequelize.define(
    "tbl_dfc_module", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        client_id: Sequelize.INTEGER,
        duration_less: Sequelize.ENUM('Well', 'Advanced'),
        duration_more: Sequelize.ENUM('Stable', 'Unstable'),
        stability_status: Sequelize.ENUM('DCM', 'NotDCM'),
        facility_based: Sequelize.INTEGER,
        community_based: Sequelize.INTEGER,
        refill_date: Sequelize.DATEONLY,
        clinical_visit_date: Sequelize.DATEONLY,
        created_by: Sequelize.INTEGER,
        updated_by: Sequelize.INTEGER,
        appointment_id: Sequelize.INTEGER,
        appointment_id_two: Sequelize.INTEGER

    }, {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_dfc_module"
    }
)
const facilityBased = sequelize.sequelize.define(
    'tbl_facility_based', {
        name: {
            type: Sequelize.STRING,
        },
    }, {
        timestamps: false,
        tableName: 'tbl_facility_based'
    }
)
const communityModel = sequelize.sequelize.define(
    'tbl_community_model', {
        name: {
            type: Sequelize.STRING,
        },
    }, {
        timestamps: false,
        tableName: 'tbl_community_model'
    }
)
DFCModulue.belongsTo(Client, {
    foreignKey: 'client_id',
})
DFCModulue.belongsTo(facilityBased, {
    foreignKey: 'facility_based',
})
DFCModulue.belongsTo(communityModel, {
    foreignKey: 'community_based',
})
module.exports.DFCModulue = DFCModulue
module.exports.facilityBased = facilityBased
module.exports.communityModel = communityModel