const sequelize = require("../db_config");
const Sequelize = require("sequelize");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const clientOutcome = sequelize.sequelize.define(
  "tbl_clnt_outcome",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: Sequelize.INTEGER,
    appointment_id: Sequelize.INTEGER,
    outcome: Sequelize.INTEGER,
    tracer_name: Sequelize.BLOB,
    tracing_type: Sequelize.INTEGER,
    tracing_date: Sequelize.DATE,
    app_status: Sequelize.STRING,
    fnl_outcome: Sequelize.INTEGER,
    return_date: Sequelize.DATEONLY,
    tracing_cost: Sequelize.DOUBLE,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    hooks: {
			beforeCreate: async (user) => {
				if (user.tracer_name) {
					user.tracer_name = await clientOutcome.encryptData(user.tracer_name);
				}
			},
			beforeUpdate: async (user) => {
				if (user.tracer_name) {
					user.tracer_name = await clientOutcome.encryptData(user.tracer_name);
				}
			},
			afterFind: async (result) => {
				const decryptFields = async (user) => {
					if (user.getDataValue('tracer_name')) {
						const decryptedtracer_name = await clientOutcome.decryptData(user.getDataValue('tracer_name'));
						user.tracer_name = decryptedtracer_name;
					}
				};

				if (Array.isArray(result)) {
					await Promise.all(result.map(decryptFields));
				} else if (result) {
					await decryptFields(result);
				}
			}
		},
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_clnt_outcome"
  }
);
// Encrypt method
clientOutcome.encryptData = async function(value) {
	if (value) {
		const encrypted = await sequelize.sequelize.query(
			`SELECT AES_ENCRYPT(?, ?) AS encrypted`,
			{
				replacements: [value, ENCRYPTION_KEY],
				type: Sequelize.QueryTypes.SELECT
			}
		);
		return encrypted[0].encrypted;
	}
	return null;
};

// Decrypt method
clientOutcome.decryptData = async function(encryptedValue) {
	if (encryptedValue) {
		const decrypted = await sequelize.sequelize.query(
			`SELECT CONVERT(AES_DECRYPT(?, ?) USING 'utf8') AS decrypted`,
			{
				replacements: [encryptedValue, ENCRYPTION_KEY],
				type: Sequelize.QueryTypes.SELECT
			}
		);
		return decrypted[0].decrypted || null;
	}
	return null;
};
exports.clientOutcome = clientOutcome;
