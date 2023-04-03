const express = require("express");
const router = express.Router();
const request = require('request');
const https = require('https');
const moment = require("moment");
const base64 = require("base64util");
const Op = require("sequelize");
//var bcrypt = require('bcrypt');
//const Sequelize = require("sequelize");

//const Sequelize = require('sequelize');


require("dotenv").config();
//var mysql = require("mysql");
const mysql = require('mysql2');
const {
    NUsers
} = require("../../models/n_users");

router.post('/signup', async(req, res) =>  {
    let phone = req.body.msisdn;
    let email_address = req.body.email;
    let password_1 = req.body.password;
    let password_2 = req.body.re_password;
    let terms = req.body.termsAccepted;
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

    //Check if Terms Are Accepted
   
    let boolVal;

    // using the JSON.parse() method
    boolVal = JSON.parse(terms);
    if (boolVal!==true) {

        return res
            .status(200)
            .json({
                success: false,
                msg: 'Signup terms have not been accepted',
            });

    }

    //Check if Passwords Are Similar
    if (password_1 !== password_2) {

        return res
            .status(200)
            .json({
                success: false,
                msg: 'Password Mis-match',
            });

    }

    //Check if Email Exists
    let check_user_email = await NUsers.findOne({
        where: {
            email:email_address
        },
        })

    if (check_user_email){
        return res
            .status(200)
            .json({
                success: false,
                msg: 'User with similar email address already exists',
            });
        }

    //Check if Telephone Number Already Exists
    let check_user_phone = await NUsers.findOne({
        where: {
            msisdn:phone
        },
        })

    if (check_user_phone){
        return res
            .status(200)
            .json({
                success: false,
                msg: 'User with similar phone number already exists',
            });
        }

    //Save Signup Details
     const new_user = await NUsers.create({
        msisdn:phone,
        password:password_1,
        email:email_address,
        terms_accepted:true,
        is_active:0,
        created_at:today,
        updated_at:today,
    });
    
    if(new_user){
        return res
        .status(200)
        .json({
            success: true,
            msg: 'Signup successfully',
        });
    }else{
         return res
        .status(500)
        .json({
            success: false,
            msg: 'An error occurred, could not create signup record',
        });
    }
   
});

module.exports = router;