const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");
const User = sequelize.sequelize.define(
  "tbl_users",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    f_name: Sequelize.STRING,
    m_name: Sequelize.STRING,
    l_name: Sequelize.STRING,
    dob: Sequelize.DATEONLY,
    phone_no: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    e_mail: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    partner_id: Sequelize.INTEGER,
    facility_id: {
      type: Sequelize.INTEGER,
      len: 5
    },
    status: Sequelize.ENUM("Active", "Disabled"),
    password: Sequelize.TEXT,
    first_access: Sequelize.ENUM("Yes", "No"),
    access_level: Sequelize.ENUM(
      "Admin",
      "Partner",
      "Facility",
      "Donor",
      "County"
    ),
    last_pass_change: Sequelize.DATEONLY,
    view_client: Sequelize.ENUM("Yes", "No"),
    rcv_app_list: Sequelize.ENUM("Yes", "No"),
    role_id: Sequelize.INTEGER,
    clinic_id: Sequelize.INTEGER,
    created_by: Sequelize.INTEGER,
    updated_by: Sequelize.INTEGER
  },
  {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    tableName: "tbl_users"
  }
);

function validateUser(user) {
  const schema = {
    f_name: Joi.string()
      .min(3)
      .max(10)
      .required(),
    m_name: Joi.string()
      .min(3)
      .max(10),
    l_name: Joi.string()
      .min(3)
      .max(10)
      .required(),
    dob: Joi.date().required(),
    phone_no: Joi.string()
      .max(10)
      .min(10)
      .required(),
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    partner_id: Joi.number(),
    facility_id: Joi.number()
      .min(5)
      .max(5),
    status: Joi.string().required(),
    password: Joi.string()
      .min(5)
      .max(255),
    first_access: Joi.string(),
    access_level: Joi.string().required(),
    view_client: Joi.string(),
    rcv_app_list: Joi.string(),
    role_id: Joi.number(),
    clinic_id: Joi.number()
  };

  return Joi.validate(user, schema);
}
exports.User = User;
exports.validateUser = validateUser;
