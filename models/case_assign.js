const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const caseAssign = sequelize.sequelize.define(
	"tbl_case_assign",
	{
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		client_id: Sequelize.INTEGER,
		other_reason: Sequelize.TEXT,
		reason_assign: {
			type: Sequelize.TEXT,
			allowNull: true
		},
		provider_id: Sequelize.INTEGER,
		relationship: Sequelize.TEXT,
		start_date: Sequelize.DATEONLY,
		end_date: Sequelize.DATEONLY,
		created_by: Sequelize.INTEGER,
		updated_by: Sequelize.INTEGER
	},
	{
		timestamps: true,
		paranoid: true,
		underscored: true,
		freezeTableName: true,
		tableName: "tbl_case_assign"
	}
);
exports.caseAssign = caseAssign;
