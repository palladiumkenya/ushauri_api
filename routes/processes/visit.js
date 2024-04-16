const express = require("express");
const router = express.Router();
const request = require('request');
const https = require('https');
const moment = require("moment");
const base64 = require("base64util");
const Op = require("sequelize");
//const Sequelize = require("sequelize");

//const Sequelize = require('sequelize');


require("dotenv").config();
//var mysql = require("mysql");
const mysql = require('mysql2');
const {
    User
} = require("../../models/user");
const {
    Client
} = require("../../models/client");
const {
    masterFacility
} = require('../../models/master_facility');
const {
    Clinic
} = require("../../models/clinic");

const {
    Visit
} = require("../../models/visits");



const { Sequelize } = require("sequelize");
const { sequelize } = require("../../db_config");



//Fetch Client Details
router.get('/search',  async (req, res) => {
    const clinic_number = req.query.ccc;
    const phone_no=req.query.phone_number;

    let check_user = await User.findOne({
    where: {
        phone_no,
    },
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })
    let client = await Client.findOne({
        where: {
            clinic_number,
        },
    })
    if (!client)
    return res.json({
        success: false,
        message: `Clinic number ${clinic_number} does not exist in the system`
    })
    let get_facility = await masterFacility.findOne({
        where: {
            code: client.mfl_code
        },
        attributes: ["code", "name"],
    })
    let get_clinic = await Clinic.findOne({
        where: {
            id: client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })

    if (client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
        })
    if (client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })
    if (get_clinic.id == '2') {
        try{

            const conn = mysql.createPool({
                connectionLimit: 10,
                host: process.env.DB_SERVER,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                debug: true,
                multipleStatements: true,
              });
              
             let  sql = `CALL sp_search_client(?,?)`;
             let todo = [clinic_number, client.mfl_code];
              conn.query(sql,todo, (error, results, fields) => {
                if (error) {
                    return console.error(error.message);
                    conn.end();
    
                  }
                
                  res.send(results[0]);
             
              
              conn.end();
              });
        
           
       
    
        }catch(err){
    
        }
    
    } else {
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not mapped to PMTCT, the client is mapped to ${get_clinic.name}. Please do a move clinic on the last icon in the appointment diary`
        })
    }

    

  });


  router.post('/enc', async(req, res) =>  {
    let message = req.body.msg;
    let phone_no = req.body.phone_no;


    message = message.split("*");
   // message = message[1];

    //message = message.split("#");

    let decoded_message = await base64.decode(message[1].trim());

   

    decoded_message = "visit*" + decoded_message;


    let variables = decoded_message.split("*");

    let msg_type=variables[0]; //Message Type ANC

    let clinic_number = variables[1];
    let is_scheduled = variables[2];
    let visit_type = variables[3];
    let other_visit_type = variables[4];
    let weight = variables[5];
    let height = variables[6];
    let bmi = variables[7];
    let z_score = variables[8];
    let muac = variables[9];
    let blood_sugar = variables[10];
    let systolic_pressure = variables[11];
    let diastolic_pressure = variables[12];
    let is_chronic_illness = variables[13];
    let illness = variables[14];
    let other_illness = variables[15];
    let ncd_status = variables[16];
    let current_regimen = variables[17];
    let who_stage = variables[18];

    let today = moment(new Date().toDateString()).format("YYYY-MM-DD");


      

   //Validate Standard Parameters- Telephone Number And Client
   let check_user = await User.findOne({
    where: {
        phone_no,
    },
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })
    let client = await Client.findOne({
        where: {
            clinic_number,
        },
    })
    if (!client)
    return res.json({
        success: false,
        message: `Clinic number ${clinic_number} does not exist in the system`
    })
    let get_facility = await masterFacility.findOne({
        where: {
            code: client.mfl_code
        },
        attributes: ["code", "name"],
    })
    let get_clinic = await Clinic.findOne({
        where: {
            id: client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })

    if (client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
        })
    if (client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })

        //Save Visit Variables
       const new_visit = await Visit.create({
        client_id: client.id,
        is_scheduled: is_scheduled,
        visit_type: visit_type,
        other_visit_type: other_visit_type,
        weight:weight,
        height:height,
        bmi:bmi,
        z_score:z_score,
        muac:muac,
        blood_sugar:blood_sugar,
        systolic_pressure:systolic_pressure,
        diastolic_pressure:diastolic_pressure,
        is_chronic_illness:is_chronic_illness,
        illness:illness,
        other_illness:other_illness,
        ncd_status:ncd_status,
        current_regimen:current_regimen,
        who_stage:who_stage,
        });
         
      
        if(new_visit){
         return res.json({
                code: 200,
                message: `Visit Encounter Record for ${clinic_number} was created successfully`
            });
        }else{
            return res.json({
                code: 500,
                message: "An error occurred, could not create Visit Encounter Record"
            });
        }

  });

  

  module.exports = router;