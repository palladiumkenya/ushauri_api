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
    pmtct_anc
} = require("../../models/pmtct_new_anc");


const {
    pmtct_pnc
} = require("../../models/pmtct_new_pnc");

const {
    pmtct_lad
} = require("../../models/pmtct_new_lad");

const {
    pmtct_baby
} = require("../../models/pmtct_new_baby");
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
    let parity_1=variables[5]; //Parity 1
    let parity_2=variables[6]; // Parity 2
    let gravida=variables[7]; // Gravida
    let lmp_date= variables[8]; // LMP Date
    let edd_date=variables[9];  //EDD date
    let gestation=variables[10];  //Gestation date
    let c_hiv_result=variables[11]; //HIV Result
    let c_date_tested=variables[12]; //Client HIV Date Tested
    let c_ccc_no=variables[13]; // Client CCC Number
    let c_enrolment_date=variables[14]; //Client Enrolment Date
    let c_art_start=variables[15]; // Client ART Start Date
    let p_hiv_result= variables[16]; // Partner Result Code
    let p_date_tested=variables[17]; //Partner Date Tested
    let p_ccc_no=variables[18]; //Partner CCC Number
    let p_enrolment_date= variables[19]; //Partner Enrolment Date
    let p_art_start=variables[20]; //Partner ART date
    let vl_date= variables[21]; //VL date
    let vl_result=variables[22]; // VL Result
    let syphilis_result=variables[23]; //Syphilis Result
    let syphilis_treatment= variables[24]; // Syphilis Treatment
    let hepatisis= variables[25]; //Hepatitis Result
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
            gestation:gestation
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

  router.post('/lad', async (req, res) => {
    let message = req.body.msg;
    //let baby = req.body.baby;
    let phone_no = req.body.phone_no;

    message = message.split("*");
   

    let decoded_message = await base64.decode(message[1].trim());

    decoded_message = "lad*" + decoded_message;


    let variables = decoded_message.split("*");

    let msg_type=variables[0]; //Message Type PNC
    let clinic_number=variables[1]; //CCC No
    let anc_visits=variables[1]; //ANC Visits
    let m_hiv_tested=variables[2]; // Mother HIV Tested
    let m_hiv_result=variables[3]; // Mother HIV Result
    let delivery_date=variables[4]; //Delivery Date
    let delivery_mode=variables[5]; //Delivery Mode
    let delivery_place=variables[6]; //Delivery Place
    let delivery_outcome=variables[7]; //Delivery Outcome
    //Baby One
    let baby_delivered_0=variables[8]; //Baby Delivery Status
    let baby_death_date_0=variables[9]; //Baby Death
    let baby_cause_of_death_0=variables[10]; //Baby Cause of Death
    let baby_date_of_birth_0=variables[11]; //Baby DOB
    let baby_sex_0=variables[12]; //Baby 
    //Baby Two
    let baby_delivered_1=variables[13]; //Baby Delivery Status
    let baby_death_date_1=variables[14]; //Baby Death
    let baby_cause_of_death_1=variables[15]; //Baby Cause of Death
    let baby_date_of_birth_1=variables[16]; //Baby DOB
    let baby_sex_1=variables[17]; //Baby 
    //Baby Three
    let baby_delivered_2=variables[18]; //Baby Delivery Status
    let baby_death_date_2=variables[19]; //Baby Death
    let baby_cause_of_death_2=variables[20]; //Baby Cause of Death
    let baby_date_of_birth_2=variables[21]; //Baby DOB
    let baby_sex_2=variables[22]; //Baby 
    //Baby Four
    let baby_delivered_3=variables[23]; //Baby Delivery Status
    let baby_death_date_3=variables[24]; //Baby Death
    let baby_cause_of_death_3=variables[25]; //Baby Cause of Death
    let baby_date_of_birth_3=variables[26]; //Baby DOB
    let baby_sex_3=variables[27]; //Baby 
    //Baby Five
    let baby_delivered_4=variables[28]; //Baby Delivery Status
    let baby_death_date_4=variables[29]; //Baby Death
    let baby_cause_of_death_4=variables[30]; //Baby Cause of Death
    let baby_date_of_birth_4=variables[31]; //Baby DOB
    let baby_sex_4=variables[32]; //Baby 

    let mother_outcome=variables[33]; //Mother Outcome


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

        const delivery_details = {
            name: req.body.title,
            description: req.body.description,
        }

        const baby_details = {
            name: req.body.title,
            description: req.body.description,
        }

        //Initiate Transaction
        var pmtct_babies = new Array();



        var pmtct_lad_payload={
            client_id:client.id,
            anc_visits:anc_visits,
            delivery_mode:delivery_mode,
            admission_date:moment(delivery_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            delivery_place:delivery_place,
            delivery_outcome:delivery_outcome,
            mother_condition:mother_outcome,
          
            created_by:check_user.id,
            created_at:today,
            updated_at:today,
            updated_by:check_user.id
        };

       
        let transaction;
        try {
            transaction = await sequelize.transaction();
            const result_delivery = await pmtct_lad.create(pmtct_lad_payload, { transaction });
            for(var i=0;i<delivery_outcome;i++){

                pmtct_babies.push({ delivery_id: result_delivery.id,
                    baby_delivered:eval("baby_delivered_"+i),
                    date_died:moment(eval("baby_death_date_"+i), "DD/MM/YYYY").format("YYYY-MM-DD"),
                    cause_of_death: eval("baby_cause_of_death_"+i),
                    baby_sex: eval("baby_sex_"+i),
                    date_birth : moment(eval("baby_date_of_birth_"+i), "DD/MM/YYYY").format("YYYY-MM-DD"),
                    created_by:check_user.id,
                    created_at:today,
                    updated_at:today,
                    updated_by:check_user.id});
                   // await pmtct_baby.create(pmtct_babies, { transaction });

            }


            await pmtct_baby.bulkCreate(pmtct_babies, { transaction });

            // console.log('success');
            await transaction.commit(); 
            return res.json({
                code: 200,
                message: `Labour & Delivery Visit Record for ${clinic_number} was created successfully`
            });

        } catch (error) {
          
            if(transaction) {
            await transaction.rollback();
            }
            return res.json({
                code: 500,
                message: error+" An error occurred, could not create Labour & Delivery Record"
            });
        }

        
  });

  router.post('/pnc', async(req, res) => {
    let message = req.body.msg;
    let phone_no = req.body.phone_no;

    message = message.split("*");
   // message = message[1];

    //message = message.split("#");

    let decoded_message = await base64.decode(message[1].trim());

   

    decoded_message = "pnc*" + decoded_message;


    let variables = decoded_message.split("*");

    let msg_type=variables[0]; //Message Type PNC
    let clinic_number=variables[1]; //CCC No
    let visit_date=variables[1]; //CCC No
    let pnc_visit_no=variables[2]; // PNC Visit No
    let pnc_clinic_no=variables[3]; //PNC Clinic No
    let client_counselled=variables[4]; //Client Counselled on FP
    let fp_method=variables[5]; //FP Method
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


        //Save PMTCT PNC Variables
        const new_pnc_visit = await pmtct_pnc.create({
            client_id:client.id,
            visit_number:pnc_visit_no,
            clinic_number:pnc_clinic_no,
            date_visit:moment(visit_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            counselled_on_fp:client_counselled,
            fp_method:fp_method,
            created_by:check_user.id,
            created_at:today,
            updated_at:today,
            updated_by:check_user.id
        });
        
         //console.log(new_anc_visit);
         if(new_pnc_visit){
            return res.json({
                   code: 200,
                   message: `PNC Visit Record for ${clinic_number} was created successfully`
               });
           }else{
               return res.json({
                   code: 500,
                   message: "An error occurred, could not create PNC Record"
               });
           }
      

  });

  module.exports = router;