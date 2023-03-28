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
    pmtct_hei
} = require("../../models/pmtct_new_hei");

const {
    pmtct_log
} = require("../../models/pmtct_new_log");


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

  router.post('/lad', async (req, res) => {
    let message = req.body.msg;
    //let baby = req.body.baby;
    let phone_no = req.body.phone_no;

      //Log Message Received
      const new_anc_log = await pmtct_log.create({
        log:message
    });

    message = message.split("*");
   

    let decoded_message = await base64.decode(message[1].trim());

    decoded_message = "lad*" + decoded_message;


    let variables = decoded_message.split("*");
    //console.log(variables);
    let msg_type=variables[0]; //Message Type PNC
    let weight_=variables[1];//Weight
    let muac_=variables[2];//MUAC
    let clinic_number=variables[3]; //CCC No
    let anc_visits_=variables[4]; //ANC Visits
    
    let m_hiv_status_delivery=variables[5]; // Mother HIV Tested
    let m_hiv_tested_=variables[6]; // Mother HIV Tested
    let m_hiv_result_=variables[7]; // Mother HIV Result
    let m_date_tested_=variables[8]; // Mother Date Tested
    let m_ccc_number_=variables[9]; // Mother CCC Number
    let m_enrolment_date_=variables[10]; // Mother Enrolment Date
    let m_art_start_date_=variables[11]; // Mother ART Start Date
    let m_regimen_=variables[12]; // Mother Regimen

    let p_hiv_result= variables[13]; // Partner Result Code
    let p_date_tested_=variables[14]; //Partner Date Tested
    let p_ccc_no=variables[15]; //Partner CCC Number
    let p_enrolment_date_= variables[16]; //Partner Enrolment Date
    let p_art_start=variables[17]; //Partner ART date

    let syphilis_result=variables[18]; //Syphilis Result
    let syphilis_treatment= variables[19]; // Syphilis Treatment
    let hepatisis= variables[20]; //Hepatitis Result
    let tb_outcome= variables[21]; //TB Outcome
    //let infant_prophylaxis= variables[22]; //Infant Prophylaxis
    let _infant_prophylaxis_azt= variables[22]; //Infant Prophylaxis AZT
    let _infant_prophylaxis_nvp= variables[23]; //Infant Prophylaxis NVP
    let _infant_prophylaxis_ctx= variables[24]; //Infant Prophylaxis CTX

    let m_haart= variables[25]; //Mother on HAART
    let m_haart_at_anc= variables[26]; //Mother HAART at ANC

    let delivery_date=variables[27]; //Delivery Date
    let delivery_mode=variables[28]; //Delivery Mode
    let delivery_place=variables[29]; //Delivery Place
    let delivery_outcome=variables[30]; //Delivery Outcome
    //Baby One
    let baby_delivered_0=variables[31]; //Baby Delivery Status
    let baby_death_date_0=variables[32]; //Baby Death
    let baby_cause_of_death_0=variables[33]; //Baby Cause of Death
    let baby_date_of_birth_0=variables[34]; //Baby DOB
    let baby_sex_0=variables[35]; //Baby 
    let baby_prophylaxis_date_0=variables[36]; //Baby Prophylaxix Date
    let baby_prophylaxis_0=variables[37]; //Baby Prophylaxis

    //Baby Two
    let baby_delivered_1=variables[38]; //Baby Delivery Status
    let baby_death_date_1=variables[39]; //Baby Death
    let baby_cause_of_death_1=variables[40]; //Baby Cause of Death
    let baby_date_of_birth_1=variables[41]; //Baby DOB
    let baby_sex_1=variables[42]; //Baby 
    let baby_prophylaxis_date_1=variables[43]; //Baby //Baby Prophylaxix Date
    let baby_prophylaxis_1=variables[44]; //Baby Baby Prophylaxis

    //Baby Three
    let baby_delivered_2=variables[45]; //Baby Delivery Status
    let baby_death_date_2=variables[46]; //Baby Death
    let baby_cause_of_death_2=variables[47]; //Baby Cause of Death
    let baby_date_of_birth_2=variables[48]; //Baby DOB
    let baby_sex_2=variables[49]; //Baby 
    let baby_prophylaxis_date_2=variables[50]; //Baby 
    let baby_prophylaxis_2=variables[51]; //Baby 
    //Baby Four
    let baby_delivered_3=variables[52]; //Baby Delivery Status
    let baby_death_date_3=variables[53]; //Baby Death
    let baby_cause_of_death_3=variables[54]; //Baby Cause of Death
    let baby_date_of_birth_3=variables[55]; //Baby DOB
    let baby_sex_3=variables[56]; //Baby 
    let baby_prophylaxis_date_3=variables[57]; //Baby 
    let baby_prophylaxis_3=variables[58]; //Baby 
    //Baby Five
    let baby_delivered_4=variables[59]; //Baby Delivery Status
    let baby_death_date_4=variables[60]; //Baby Death
    let baby_cause_of_death_4=variables[61]; //Baby Cause of Death
    let baby_date_of_birth_4=variables[62]; //Baby DOB
    let baby_sex_4=variables[63]; //Baby 
    let baby_prophylaxis_date_4=variables[64]; //Baby 
    let baby_prophylaxis_4=variables[65]; //Baby 

    let mother_outcome=variables[66]; //Mother Outcome


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

       
        //Initiate Transaction
        const pmtct_babies = new Array();



        const pmtct_lad_payload={
            client_id:client.id,
            anc_visits:anc_visits_,
            delivery_mode:delivery_mode,
            admission_date:moment(delivery_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            delivery_place:delivery_place,
            delivery_outcome:delivery_outcome,
            mother_condition:mother_outcome,
            weight:weight_,
            muac:muac_,
            delivery_hiv_status:m_hiv_status_delivery,
            is_hiv_tested:m_hiv_tested_,
            m_status:m_hiv_result_,
            m_date_tested:moment(m_date_tested_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_ccc_number:m_ccc_number_,
            m_enrolment_date:moment(m_enrolment_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_art_start_date:moment(m_art_start_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_regimen:m_regimen_,
            p_status:p_hiv_result,
            p_date_tested:moment(p_date_tested_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_ccc_number:p_ccc_no,
            p_enrolment_date:moment(p_enrolment_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_art_start_date:moment(p_art_start, "DD/MM/YYYY").format("YYYY-MM-DD"),
            tb_outcome:tb_outcome,
           // infant_prophylaxis:infant_prophylaxis,
            infant_prophylaxis_azt:_infant_prophylaxis_azt,
            infant_prophylaxis_nvp:_infant_prophylaxis_nvp,
            infant_prophylaxis_ctx:_infant_prophylaxis_ctx,
            is_syphyilis:syphilis_result,
            syphilis_treatment:syphilis_treatment,
            hepatitis_b:hepatisis,
            m_started_haart:m_haart,
            m_on_haart_anc:m_haart_at_anc,
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
                    prophylaxix_date:moment(eval("baby_prophylaxis_date_"+i), "DD/MM/YYYY").format("YYYY-MM-DD"),
                    prophylaxis: eval("baby_prophylaxis_"+i),
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

      //Log Message Received
      const new_anc_log = await pmtct_log.create({
        log:message
    });

    message = message.split("*");
   // message = message[1];

    //message = message.split("#");

    let decoded_message = await base64.decode(message[1].trim());

   

    decoded_message = "pnc*" + decoded_message;


    let variables = decoded_message.split("*");

    let msg_type=variables[0]; //Message Type PNC
    let clinic_number=variables[1]; //CCC No
    let visit_date=variables[2]; //CCC No
    let pnc_clinic_no=variables[3]; //PNC Clinic No

    let pnc_visit_no=variables[4]; // PNC Visit No
   
    let anc_visits_=variables[5]; //ANC Visits
    
    let m_hiv_status_pnc=variables[6]; // Mother HIV Tested
    let m_is_hiv_tested=variables[7]; //Mother Tested for HIV
    let m_hiv_result_=variables[8]; // Mother HIV Result  
    let m_date_tested_=variables[9]; // Mother Date Tested
    let m_ccc_number_=variables[10]; // Mother CCC Number
    let m_enrolment_date_=variables[11]; // Mother Enrolment Date
    let m_art_start_date_=variables[12]; // Mother ART Start Date
    let m_regimen_=variables[13]; // Mother Regimen

    let p_hiv_result= variables[14]; // Partner Result Code
    let p_date_tested_=variables[15]; //Partner Date Tested
    let p_ccc_no=variables[16]; //Partner CCC Number
    let p_enrolment_date_= variables[17]; //Partner Enrolment Date
    let p_art_start=variables[18]; //Partner ART date


    let tb_outcome= variables[19]; //TB Outcome
    //let infant_prophylaxis= variables[22]; //Infant Prophylaxis
    let _infant_prophylaxis_azt= variables[20]; //Infant Prophylaxis AZT
    let _infant_prophylaxis_nvp= variables[21]; //Infant Prophylaxis NVP
    let _infant_prophylaxis_ctx= variables[22]; //Infant Prophylaxis CTX

    let m_haart= variables[23]; //Mother on HAART
    let m_haart_at_anc= variables[24]; //Mother HAART at ANC

    let delivery_mode=variables[25]; // Delivery Mode
    let place_delivery=variables[26]; //Delivery Place
    // let mother_regimen=variables[7]; //Regimen
    // let mother_regimen_other=variables[8]; //Regimen
     let baby_immunization=variables[27]; // Immunization
     
     let client_counselled=variables[28]; //Client Counselled on FP
     let fp_method=variables[29]; //FP Method
     let mother_outcome=variables[30]; //Mother Outcome
     let date_died=variables[31]; //Date Died
     let cause_of_death=variables[32]; //Cause of Death
    
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
            delivery_mode:delivery_mode,
            place_delivery:place_delivery,
            baby_immunization:baby_immunization,
            mother_outcome:mother_outcome,
            date_died:moment(date_died, "DD/MM/YYYY").format("YYYY-MM-DD"),
            cause_of_death:cause_of_death,
            //mother_regimen_other:mother_regimen_other
            mother_regimen_other:m_regimen_,
            anc_visits:anc_visits_,
            pnc_hiv_status:m_hiv_status_pnc,
            m_tested_hiv:m_is_hiv_tested,
            
            m_status:m_hiv_result_,
            m_date_tested:moment(m_date_tested_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_ccc_number:m_ccc_number_,
            m_enrolment_date:moment(m_enrolment_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_art_start_date:moment(m_art_start_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            m_regimen:m_regimen_,
            p_status:p_hiv_result,
            p_date_tested:moment(p_date_tested_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_ccc_number:p_ccc_no,
            p_enrolment_date:moment(p_enrolment_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
            p_art_start_date:moment(p_art_start, "DD/MM/YYYY").format("YYYY-MM-DD"),
            tb_outcome:tb_outcome,
           // infant_prophylaxis:infant_prophylaxis,
            infant_prophylaxis_azt:_infant_prophylaxis_azt,
            infant_prophylaxis_nvp:_infant_prophylaxis_nvp,
            infant_prophylaxis_ctx:_infant_prophylaxis_ctx,
            m_started_haart:m_haart,
            m_on_haart_anc:m_haart_at_anc,


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



  router.post('/hei', async(req, res) => {
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

   

    decoded_message = "hei*" + decoded_message;


    let variables = decoded_message.split("*");

    let msg_type=variables[0]; //Message Type PNC
    let hei_number=variables[1]; //HEI No
    let _infant_prophylaxis_azt= variables[2]; //Infant Prophylaxis AZT
    let _infant_prophylaxis_nvp= variables[3]; //Infant Prophylaxis NVP
    let _infant_prophylaxis_ctx= variables[4]; //Infant Prophylaxis CTX
    let weight_=variables[5]; //Weight
    let height_=variables[6]; //Height

    let height_cat=variables[7]; //Height Category
   
    let muac_=variables[8]; //MUAC
    
    let tb_screening_=variables[9]; //TB Testing Outcome
    let infant_feeding_=variables[10]; //Infant Feeding
    let is_pcr_done_=variables[11]; //PCR Done
    let eid_sample_date=variables[12]; //EID Sample Date
    let is_eid_done=variables[13]; // EID Done
    let pcr_result_=variables[14]; // PCR Result
    let confirmatory_pcr_=variables[15]; //Confirmatory PCR
   
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
            hei_no: hei_number
        },
    })
    if (!client)
    return res.json({
        success: false,
        message: `HEI number ${hei_number} does not exist in the system`
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
            message: `HEI ${hei_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
        })
    if (client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `HEI ${hei_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${hei_number} is not active in the system.`
        })


        //Save PMTCT HEI Visit Variables
        const new_hei_visit = await pmtct_hei.create({
            client_id:client.id,
                 
            weight:weight_,
            height:height_,
            height_category:height_cat,
            muac:muac_,
            tb_screening:tb_screening_,
          
            infant_feeding:infant_feeding_,
            was_pcr_done:is_pcr_done_,
            date_eid_sample:moment(eid_sample_date, "DD/MM/YYYY").format("YYYY-MM-DD"),
            eid_test:is_eid_done,
            pcr_result:pcr_result_,
            confirm_pcr:confirmatory_pcr_,
           infant_prophylaxis_azt:_infant_prophylaxis_azt,
            infant_prophylaxis_nvp:_infant_prophylaxis_nvp,
            infant_prophylaxis_ctx:_infant_prophylaxis_ctx,
            


            created_by:check_user.id,

            created_at:today,
            updated_at:today,
            updated_by:check_user.id
        });
        
         //console.log(new_anc_visit);
         if(new_hei_visit){
            return res.json({
                   code: 200,
                   message: `HEI Visit Record for ${clinic_number} was created successfully`
               });
           }else{
               return res.json({
                   code: 500,
                   message: "An error occurred, could not create PNC Record"
               });
           }
      

  });

  module.exports = router;