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
    visits
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


  router.post('/anc', async(req, res) =>  {
    let message = req.body.msg;
    let phone_no = req.body.phone_no;


    //Log Message Received
    const new_anc_log = await pmtct_log.create({
        log:message
    });


    message = message.split("*");
   // message = message[1];

    //message = message.split("#");

    let decoded_message = await base64.decode(message[1].trim());

   

    decoded_message = "anc*" + decoded_message;


    let variables = decoded_message.split("*");

    let msg_type=variables[0]; //Message Type ANC

    
    let clinic_number=variables[1]; //CC No
    //console.log(clinic_number);
    let anc_visit_no=variables[2]; // ANC Visit No
    let anc_clinic_no=variables[3]; //ANC Clinic No
    let client_type=variables[4]; // Client Type
    let weight_ =variables[5]; // Client Type
    let muac_ =variables[6]; // Client Type

    let parity_1=variables[7]; //Parity 1
    let parity_2=variables[8]; // Parity 2
    let gravida=variables[9]; // Gravida
    let lmp_date= variables[10]; // LMP Date
    let edd_date=variables[11];  //EDD date
    let gestation=variables[12];  //Gestation date
    let c_hiv_status=variables[13]; //HIV Status
    let c_hiv_tested=variables[14]; //HIV Tested
    let c_hiv_result=variables[15]; //HIV Result
    let c_date_tested=variables[16]; //Client HIV Date Tested
    let c_ccc_no=variables[17]; // Client CCC Number
    let c_enrolment_date=variables[18]; //Client Enrolment Date
    let c_art_start=variables[19]; // Client ART Start Date
    let p_hiv_result= variables[20]; // Partner Result Code
    let p_date_tested_=variables[21]; //Partner Date Tested
    let p_ccc_no=variables[22]; //Partner CCC Number
    let p_enrolment_date_= variables[23]; //Partner Enrolment Date
    let p_art_start=variables[24]; //Partner ART date
    let syphilis_result=variables[25]; //Syphilis Result
    let syphilis_treatment= variables[26]; // Syphilis Treatment
    let hepatisis= variables[27]; //Hepatitis Result
    let tb_outcome= variables[28]; //TB Outcome
    let _infant_prophylaxis_azt= variables[29]; //Infant Prophylaxis AZT
    let _infant_prophylaxis_nvp= variables[30]; //Infant Prophylaxis NVP
    let _infant_prophylaxis_ctx= variables[31]; //Infant Prophylaxis CTX
    let vl_date= variables[32]; //VL date
    let vl_result_=variables[33]; // VL Result
    let vl_result_type_=variables[34]; // VL ResultType
    
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

        //Save PMTCT Variables
       const new_anc_visit = await pmtct_anc.create({
            client_id:client.id,
            visit_number:anc_visit_no,
            clinic_number:anc_clinic_no,
            client_type:client_type,
            parity_one:parity_1,
            parity_two:parity_2,
            gravida:gravida,
            lmp_date:moment(lmp_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            edd: moment(edd_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            created_by:check_user.id,
            created_at:today,
            updated_at:today,
            updated_by:check_user.id,
            is_syphyilis:syphilis_result,
            syphilis_treatment:syphilis_treatment,
            hepatitis_b:hepatisis,
            gestation:gestation,
            weight:weight_,
            muac:muac_,
            hiv_testing_before_anc:c_hiv_status,
            is_hiv_tested:c_hiv_tested,
            m_status:c_hiv_result,
            m_date_tested:moment(c_date_tested, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_ccc_number:c_ccc_no,
            m_enrolment_date:moment(c_enrolment_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_art_start_date:moment(c_art_start, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_status:p_hiv_result,
            p_date_tested:moment(p_date_tested_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_ccc_number:p_ccc_no,
            p_enrolment_date:moment(p_enrolment_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_art_start_date:moment(p_art_start, "DD/MM/YYYY").format("YYYY-MM-DD"),
            tb_outcome:tb_outcome,
            infant_prophylaxis_azt:_infant_prophylaxis_azt,
            infant_prophylaxis_nvp:_infant_prophylaxis_nvp,
            infant_prophylaxis_ctx:_infant_prophylaxis_ctx,
            vl_result:vl_result_,
            vl_result_type:vl_result_type_,
            vl_test_date:moment(vl_date, "DD/MM/YYYY").format("YYYY-MM-DD")
        });
         
        //console.log(new_anc_visit);
        if(new_anc_visit){
         return res.json({
                code: 200,
                message: `ANC Visit Record for ${clinic_number} was created successfully`
            });
        }else{
            return res.json({
                code: 500,
                message: "An error occurred, could not create ANC Record"
            });
        }

  });

  

  module.exports = router;