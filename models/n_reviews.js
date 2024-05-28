const sequelize = require("../db_config");
const Sequelize = require("sequelize");
const Joi = require("joi");

const NReviews = sequelize.sequelize.define(
    "tbl_nishauri_reviews", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user_id:Sequelize.INTEGER,
        rate:Sequelize.INTEGER,
        reviews:Sequelize.STRING,
    }, {
        timestamps: true,
        paranoid: true,
        underscored: true,
        freezeTableName: true,
        tableName: "tbl_nishauri_reviews"
    }
);
exports.NReviews = NReviews;