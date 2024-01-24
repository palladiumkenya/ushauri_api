const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const caseHome = sequelize.sequelize.define(
	"tbl_case_home_visit",
	{
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		client_id: Sequelize.INTEGER,
		family_member_name: Sequelize.TEXT,
		telephone_no: {
			type: Sequelize.STRING
		},
		landmark: Sequelize.TEXT,
		patient_independent: Sequelize.TEXT,
        basic_need: Sequelize.TEXT,
        sexual_partner: Sequelize.TEXT,
        disclosed_hiv_status: Sequelize.TEXT,
        disclosed_person: Sequelize.TEXT,
        arv_stored: Sequelize.TEXT,
        arv_taken: Sequelize.TEXT,
        social_support_household: Sequelize.TEXT,
        social_support_community: Sequelize.TEXT,
        non_clinical_services: Sequelize.TEXT,
        mental_health: Sequelize.TEXT,
        stress_situation: Sequelize.TEXT,
        use_drug: Sequelize.TEXT,
        side_effect: Sequelize.TEXT,
        other_note: Sequelize.TEXT,
		created_by: Sequelize.INTEGER,
		updated_by: Sequelize.INTEGER
	},
	{
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName: true,
		tableName: "tbl_case_home_visit"
	}
);
exports.caseHome = caseHome;
