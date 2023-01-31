const express = require("express");
const router = express.Router();
const request = require('request');
const https = require('https');
const moment = require("moment");
const base64 = require("base64util");
const Op = require("sequelize").Op;

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


//Fetch Client Details
router.get('/search',  async (req, res) => {
    const clinic_number = req.query.ccc;
    const phone_no=req.query.phone_number;

   // console.log(vTelephone)

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


  router.post('/anc', (req, res) => {
    const message = req.body.msg;
    const telephone = req.body.telephone;

    //console.log(telephone)
    
   // message = message.split("*");
  //  message = message[1];

   // message = message.split("#");

   // let decoded_message = await base64.decode(message[0].trim());

    //decoded_message = "anc*" + decoded_message;


   // const variables = decoded_message.split("*");
   // const vTo = req.query.end;
    //const vTelephone=req.body.telephone;

    //console.log(vTelephone)

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
          
         let  sql = `CALL sp_log(?)`;
         let todo = [message];
          conn.query(sql,todo, (error, results) => {
            if (error) {
                return res.json({
                    success: false,
                    message: `Error. ANC Record could not be created`
                })
                
                //return console.error(error.message);
                conn.end();



              }
              //console.log(results[0]);

           
            return res.json({
                success: true,
                message: `ANC Record was created successfully`
            })

            //  res.send(results[0]);
         
           
            conn.end();
          });
    
       
   

    }catch(err){

    }


  });

  router.post('/lad', (req, res) => {
    const message = req.body.msg;
    const telephone = req.body.telephone;

    //console.log(telephone)
    
   // message = message.split("*");
  //  message = message[1];

   // message = message.split("#");

   // let decoded_message = await base64.decode(message[0].trim());

    //decoded_message = "anc*" + decoded_message;


   // const variables = decoded_message.split("*");
   // const vTo = req.query.end;
    //const vTelephone=req.body.telephone;

    //console.log(vTelephone)

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
          
         let  sql = `CALL sp_log(?)`;
         let todo = [message];
          conn.query(sql,todo, (error, results) => {
            if (error) {
                return res.json({
                    success: false,
                    message: `Error. Labour & Delivery Record could not be created`
                })
                
                //return console.error(error.message);
                conn.end();



              }
              //console.log(results[0]);

           
            return res.json({
                success: true,
                message: `Labour & Delivery Record was created successfully`
            })

            //  res.send(results[0]);
         
           
            conn.end();
          });
    
       
   

    }catch(err){

    }


  });

  router.post('/pnc', (req, res) => {
    const message = req.body.msg;
    const telephone = req.body.telephone;

    //console.log(telephone)
    
   // message = message.split("*");
  //  message = message[1];

   // message = message.split("#");

   // let decoded_message = await base64.decode(message[0].trim());

    //decoded_message = "anc*" + decoded_message;


   // const variables = decoded_message.split("*");
   // const vTo = req.query.end;
    //const vTelephone=req.body.telephone;

    //console.log(vTelephone)

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
          
         let  sql = `CALL sp_log(?)`;
         let todo = [message];
          conn.query(sql,todo, (error, results) => {
            if (error) {
                return res.json({
                    success: false,
                    message: `Error. PNC Record could not be created`
                })
                
                //return console.error(error.message);
                conn.end();



              }
              //console.log(results[0]);

           
            return res.json({
                success: true,
                message: `PNC Record was created successfully`
            })

            //  res.send(results[0]);
         
           
            conn.end();
          });
    
       
   

    }catch(err){

    }


  });

  module.exports = router;