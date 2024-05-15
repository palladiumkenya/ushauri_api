const express = require("express");
const router = express.Router();
const request = require('request');
const https = require('https');
const moment = require("moment");
const base64 = require("base64util");
const {spawn} = require('child_process');

require("dotenv").config();

//import { client_chat } from "@gradio/client";
//const client_chat = require('@gradio/client', { force: true });
//const dynamic = new Function('modulePath', 'return import(modulePath)');


//const { client_chat } = require("@gradio/client");



//const Op = require("sequelize");
var { Op, Sequelize } = require("sequelize");
var bcrypt = require('bcrypt');

//const Sequelize = require("sequelize");

//const Sequelize = require('sequelize');


require("dotenv").config();
//var mysql = require("mysql");
const mysql = require('mysql2');
const {
    NUsers
} = require("../../models/n_users");
const {
  NUserprograms
} = require("../../models/n_user_programs");

const {
    Client
} = require("../../models/client");
const {
  Napptreschedule
} = require("../../models/n_appoint_reschedule");

const {
  NLogs
} = require("../../models/n_logs");
const { parse } = require("path");



generateOtp = function (size) {
    const zeros = '0'.repeat(size - 1);
    const x = parseFloat('1' + zeros);
    const y = parseFloat('9' + zeros);
    const confirmationCode = String(Math.floor(x + Math.random() * y));
 return confirmationCode;
}

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
   // let check_user_email = await NUsers.findOne({
    //    where: {
    //        email:email_address
    //    },
    //    })

   // if (check_user_email){
    //    return res
      //      .status(200)
        //    .json({
          //      success: false,
            //    msg: 'User with similar email address already exists',
           // });
       // }

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
    const password_hash=bcrypt.hashSync(password_1, 10);

    //console.log(password_hash);
     const new_user = await NUsers.create({
        msisdn:phone,
        password:password_hash,
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


//Sign-In Users
router.post('/signin', async(req, res) =>  {
    let vusername = req.body.user_name;
    let password_1 = req.body.password;
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

    //Check If User Exists
    //console.log(vusername);
    let check_username= await NUsers.findOne({
        where: {
          [Op.or]: [
            { msisdn: vusername },
            { email: vusername }
          ]
        }
      });

      //console.log(check_username.password);

      if(check_username)
      {
        var password_hash=check_username.password;
        //console.log(password_hash);
        const verified = bcrypt.compareSync(password_1, password_hash);
        if(verified) 
        {

           if(check_username.is_active==='0'){
             //Log Login Date
             var l = {
                user_id: base64.encode(check_username.id),
                page_id: 0,
            }
            
             try {
                const log_login = await NUsers.update(
                  { last_login: today },
                  { where: { id: check_username.id } }
                )
                //Show Page To Add CCC or Program Number
                return res
                .status(200)
                .json({
                    success: true,
                    msg: 'Signin successfully',
                    data:l
                });
              } catch (err) {
                return res
                .status(200)
                .json({
                    success: false,
                    msg: 'Failed to sign-in successfully',
                    data:l
                });
              }
           }else if(check_username.is_active==='1')
           {

            //Log Activity
            var log_activity_=NLogs.create({ user_id:check_username.id, access:'LOGIN'});

            //Log Login Date
            var l = {
                user_id: base64.encode(check_username.id),
                page_id: 1,
            }
            
             try {
                const log_login = await NUsers.update(
                  { last_login: today },
                  { where: { id: check_username.id } }
                )
                //Go to home page
                var l = {
                    user_id: base64.encode(check_username.id),
                    page_id: 1,
                }
                return res
                .status(200)
                .json({
                    success: true,
                    msg: 'Signin successfully',
                    data:l
                });
              } catch (err) {
                return res
                .status(200)
                .json({
                    success: false,
                    msg: 'Failed to sign-in successfully',
                    data:l
                });
              }

           }    
        }else{
            return res
            .status(200)
            .json({
                success: false,
                msg: 'Wrong Password Provided',
            });
        }
    
      }else{
        return res
        .status(200)
        .json({
            success: false,
            msg: 'Invalid Email/Telephone Number Provided',
        });
      }

  
   
});




//Password Reset Users
router.post('/resetpassword', async(req, res) =>  {
    let vusername = req.body.user_name;
   // let password_1 = req.body.password;
   let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
   let vtoday = moment(new Date().toDateString()).tz("Africa/Nairobi").format("H:M:S");


    //Check If User Exists
    //console.log(vusername);
    let check_username= await NUsers.findOne({
        where: {
          [Op.or]: [
            { msisdn: vusername },
            { email: vusername }
          ]
        }
      });


      if(check_username)
      {
        //Generate OTP and send to Users Via Email or Telephone Number
        let vOTP=generateOtp(5);

        //Send SMS       
        const header_details= {
           "rejectUnauthorized": false,
            url: process.env.SMS_API_URL,
            method: 'POST',
            json: true,
            headers: {
              Accept: 'application/json',
              'api-token': process.env.SMS_API_KEY
            },
          
            body: {
                'destination': check_username.msisdn,
                'msg': 'Dear Nishauri User, Your OTP for password reset is '+vOTP+'. Valid for the next 24 hours.',
                'sender_id': check_username.msisdn,
                'gateway': process.env.SMS_SHORTCODE
            }
        }

        request.post(header_details,  (err, res, body) => {
        if(err)
        {
            console.log(err);
             //Error Sending OTP
            return res
             .status(200)
             .json({
                success: false,
               msg: 'Error Sending OTP',
            });
        }   
        });

         //Save OTP Details
         const log_OTP = await NUsers.update(
            { otp_gen_date: today, otp_number: vOTP, otp_gen_hour:vtoday },
            { where: { id: check_username.id} }
          );

          var l = {
            user_id: base64.encode(check_username.id),
            page_id: 3,
        }
        
          //return success on OTP 
          return res
          .status(200)
          .json({
              success: true,
              msg: 'OTP sent successfully',
              data:l
          });
    
      }else{
        return res
        .status(200)
        .json({
            success: false,
            msg: 'Invalid Email/Telephone Number Provided',
        });
      }

  
   
});

//Verify OTP Details
router.post('/verifyotp', async(req, res) =>  {
    let otp_verify = req.body.otp;
    let user_id = req.body.user_id;
    let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
    //Check If User Exists
    let check_username= await NUsers.findOne({
        where: {
          [Op.and]: [
            { otp_number: otp_verify},
            { id: base64.decode(user_id) }
          ]
        }
      });


      if(check_username)
      {
        var l = {
            user_id: base64.encode(check_username.id),
            page_id: 0,
        }
        
          //return success on OTP Verification 
          return res
          .status(200)
          .json({
              success: true,
              msg: 'OTP Verified Successfully',
              data:l
          });
        
        
    
      }else{
        //return success on OTP Verification 
        return res
        .status(200)
        .json({
            success: false,
            msg: 'Invalid or Expired OTP'
        });
      }
   
});

//update password 
router.post('/updatepassword', async(req, res) =>  {
    let password_1 = req.body.password;
    let password_2 = req.body.re_password;
    let user_id = req.body.user_id;
    let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
    
     //Check if Passwords Are Similar
     if (password_1 !== password_2) {

        return res
            .status(200)
            .json({
                success: false,
                msg: 'Password Mis-match',
            });

    }

    const password_hash=bcrypt.hashSync(password_1, 10);

    try {
        const log_login = await NUsers.update(
          { password: password_hash },
          { where: { id: base64.decode(user_id)} }
        )
      
        return res
        .status(200)
        .json({
            success: true,
            msg: 'Password reset successfully'
        });
      } catch (err) {
        return res
        .status(200)
        .json({
            success: false,
            msg: 'Failed to update new password'
        });
      }

    
   
  
   
});


//Set Programs 
router.post('/validate_program', async(req, res) =>  {
  let ccc_no = req.body.ccc_no;
  let upi_no = req.body.upi_no;
  let firstname = req.body.firstname.toUpperCase().trim(); //Trim & Capitalize FirstName
  let user_id = req.body.user_id;
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  
    //Check if CCC is 10 digits
    if (ccc_no.length != 10 ) {

      return res
          .status(200)
          .json({
              success: false,
              msg: `Invalid CCC Number: ${ccc_no}, The CCC must be 10 digits`,
          });

  }  
  
  //Check If User Exists
  var check_username= await NUsers.findOne({
      where: {
        [Op.and]: [
          { is_active: '0'},
          { id: base64.decode(user_id) }
        ]
      }
    });
    


  //User Is Not Active
  //Validate Program In HIV

  const check_program_valid= await Client.findOne({
      where:{
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('UPPER', Sequelize.col('f_name')),
            Sequelize.fn('UPPER', firstname)
        ),
          { clinic_number: ccc_no }
        ]
      } 
      });
      
    //console.log(check_program_valid);

   if(!check_program_valid)
   {
    return res
    .status(200)
    .json({
        success: false,
        msg: `Invalid CCC Number/ First Name Match: ${ccc_no}, The CCC Number/First Name does not match in Nishauri`,
    });
   }

  if(check_username) //User Account Not Active- Show Page to Enter Program Indentification Details
  {
    let vOTP='';
      //Generate OTP
       //Generate OTP and send to Users Via Email or Telephone Number
       //Check if OTP was generated and has not expired
       if((check_username.profile_otp_number!=null) || (check_username.profile_otp_date!=null))
       {

        let date_diff = moment(today).diff(
          moment(check_username.profile_otp_date).format("YYYY-MM-DD HH:MM:SS"),
          "seconds"
        );
        console.log(date_diff);
        if(date_diff<=3600) //60 Seconds
        {
          vOTP=check_username.profile_otp_number //Use OTP

        }else
        {
          vOTP=generateOtp(5); //OTP expired or Not sent yet.. Generate a New OTP
            //Update New OTP
        const log_OTP = await NUsers.update(
          { profile_otp_date: today, profile_otp_number: vOTP},
          { where: { id:  base64.decode(user_id) } }
        );
    
        }     

       }else
       {
          vOTP=generateOtp(5); //OTP expired or Not sent yet.. Generate a New OTP 
            //Update New OTP
            const log_OTP = await NUsers.update(
            { profile_otp_date: today, profile_otp_number: vOTP},
            { where: { id:  base64.decode(user_id) } }
          );
       }

      

       
       //Send SMS       
       const header_details= {
          "rejectUnauthorized": false,
           url: process.env.SMS_API_URL,
           method: 'POST',
           json: true,
           headers: {
             Accept: 'application/json',
             'api-token': process.env.SMS_API_KEY
           },
         
           body: {
               'destination': check_program_valid.phone_no,
               'msg': 'Dear Nishauri User, Your OTP to complete profile is '+vOTP+'. Valid for the next 24 hours.',
               'sender_id': check_program_valid.phone_no,
               'gateway': process.env.SMS_SHORTCODE
           }
       }

       //console.log(header_details);
       request.post(header_details,  (err, res, body) => {
       if(err)
       {
           //console.log(err);
            //Error Sending OTP
           return res
            .status(200)
            .json({
               success: false,
              msg: 'Error Sending OTP',
           });
       }else if (res.statusCode !== 200) {
        console.error('Request failed with status code:', res.statusCode);
        } else {
          // Success! Do something with the response body
          console.log('Success:', body.status);
        }   
       });

      

         var l = {
           user_id: base64.encode(check_username.id),
           mohupi_:upi_no,
           cccno:ccc_no,
           firstname:firstname,
           phoneno:check_program_valid.phone_no
       }
       

      //Sent OTP Number
      return res
      .status(200)
      .json({
          success: true,
          msg: 'User OTP sent out successfully',
          data:l,
      });
  
  }else{

      //Show Error Message 
      return res
      .status(500)
      .json({
          success: false,
          msg: 'Program registration record already exists',
      });

  }
 
});


//Set Programs 
router.post('/setprogram', async(req, res) =>  {
    let ccc_no = req.body.ccc_no;
    let upi_no = req.body.upi_no;
    let firstname = req.body.firstname.toUpperCase().trim(); //Trim & Capitalize FirstName
    let user_id = req.body.user_id;
    let otp=req.body.otp_number;
    let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
    
      //Check if CCC is 10 digits
      if (ccc_no.length != 10 ) {

        return res
            .status(200)
            .json({
                success: false,
                msg: `Invalid CCC Number: ${ccc_no}, The CCC must be 10 digits`,
            });

    }  
    
    //Check If User Exists
      let check_username= await NUsers.findOne({
        where: {
          [Op.and]: [
            { is_active: '0'},
            { id: base64.decode(user_id) }
          ]
        }
      });

      

    //User Is Not Active
    //Validate Program In HI

  const check_program_valid= await Client.findOne({
      where:{
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('UPPER', Sequelize.col('f_name')),
            Sequelize.fn('UPPER', firstname.toUpperCase())
        ),
          { clinic_number: ccc_no }
        ]
      } 
      });

     if(!check_program_valid)
     {
      return res
      .status(200)
      .json({
          success: false,
          msg: `Invalid CCC Number/ First Name Match: ${ccc_no}, The CCC Number/First Name does not match in Nishauri`,
      });

     }


     //Check if OTP is Valid
     let otp_validate= await NUsers.findOne({
      where: {
        [Op.and]: [
          { profile_otp_number: otp},
          { id: base64.decode(user_id) }
        ]
      }
    });


    if(!otp_validate)
    {
      return res
      .status(200)
      .json({
          success: false,
          msg: 'Invalid or Expired OTP'
      });
    }

    if(check_username) //User Account Not Active- Show Page to Enter Program Indentification Details
    {
        //Search if Program Details Exist
        let check_program= await NUserprograms.findOne({
            where: {
              [Op.and]: [
                { program_identifier: check_program_valid.id},
                { user_id: base64.decode(user_id) },
                { program_type: '1'} // Set 1 for HIV program
              ]
            }
          });

        if(!check_program)
        {

          //Update Login & Active Login

          const log_active_login = await NUsers.update(
            { is_active: '1' },
            { where: { id:base64.decode(user_id)} }
          );
        //Save Program Details If Exist
        const  new_user_program = await NUserprograms.create({
            user_id:base64.decode(user_id),
            program_type:'1',
            program_identifier:check_program_valid.id,
            moh_upi_no:upi_no,
            is_active:'1',
            activation_date:today,
            created_at:today,
            updated_at:today,
        });
        
        if(new_user_program){
            return res
            .status(200)
            .json({
                success: true,
                msg: 'Program Registration Succesfully. Please Login to access personalized data',
            });
        }else{
             return res
            .status(500)
            .json({
                success: false,
                msg: 'An error occurred, could not create program record',
            });
        }
       
        }else
        {
          return res
          .status(200)
          .json({
              success: true,
              msg: 'Program Already Exist Succesfully. Please Login to access personalized data',
          });

        }
        
    
    }else{

        //Show Error Message 
        return res
        .status(500)
        .json({
            success: false,
            msg: 'Program registration record already exists',
        });

    }
   
});


//Fetch Home Details

router.get('/profile',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_profile(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});




//Fetch Home Upcoming Appointments
router.get('/current_appt',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_current_appt(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
               //Log Activity
               var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'APPOINTMENTS'});
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});


//Fetch Appointment Trends
router.get('/appointment_trends',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_appointment_trend(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
               var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'APPOINTMENTS_TRENDS'});

                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});



//Missed Appointment by type

router.get('/appointment_missed',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_appt_missed(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});

//previous appointment list
router.get('/appointment_previous',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_history_appt(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});

//previous appointment list
router.get('/appointment_future',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_future_appt(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});




//Reschedule Appointment
router.post('/reschedule', async(req, res) =>  {
  let app_id = req.body.appt_id;
  let reason_ = req.body.reason;
  let proposed_date_ = req.body.reschedule_date;
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  
  
  //Check if we already have an existing reschedule request

   //Search if Program Details Exist
   let check_reschedule_request_exists= await Napptreschedule.findOne({
    where: {
      [Op.and]: [
        { appointment_id: app_id},
        { status: '0'} // Set 1 for HIV program
      ]
    }
  });
  if(!check_reschedule_request_exists)
  {

    
      //Save Program Details If Exist
      const  new_appt_request = await Napptreschedule.create({
        appointment_id:app_id,
        reason:reason_,
        request_date:today,
        proposed_date:moment(proposed_date_, "DD/MM/YYYY").format("YYYY-MM-DD"),
        created_at:today,
        updated_at:today,
    });
    
    if(new_appt_request){
        return res
        .status(200)
        .json({
            success: true,
            msg: 'Reschedule request submitted successfully. ',
        });
    }else{
         return res
        .status(200)
        .json({
            success: false,
            msg: 'An error occurred, could not create appointment reschedule request',
        });
    }

  }else{

    //Return Appointment Reschedule Already exist
       //Show Error Message 
       return res
       .status(200)
       .json({
           success: false,
           msg: 'Appointment Reschedule Request Record Already Exist',
       });


      } 
 
});

//Fetch Regimen

router.get('/vl_result', async(req, res) =>  {
  const userid = req.query.user_id;
  
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  console.log(base64.decode(userid));
  
  //Check if we already have an existing reschedule request

   //Search if Program Details Exist
   let check_ccc_no = await NUserprograms.findOne({
    where: {
      [Op.and]: [
        { user_id: base64.decode(userid) },
        { program_type: '1'}, // Set 1 for HIV program
        { is_active: '1'} // Set 1 for HIV program
      ]
    }
  });
// console.log(check_ccc_no);
  if(check_ccc_no)
  {

    //Get Client Details
    let check_program_valid= await Client.findOne({
      where: {
        id: check_ccc_no.program_identifier
     }
    });

  
    if(check_program_valid)
    {
      //Call mLab Instance
     client_payload='{"ccc_number": "'+check_program_valid.clinic_number+'"}';
     // client_payload='{"ccc_number": "1073900337"}';
      const url_details = {
        url: process.env.MLAB_URL,
        json: true,
        body: JSON.parse(client_payload),
        "rejectUnauthorized": false,

       
      }

      request.post(url_details, (err, res_, body) => {
        if (err) {
          return console.log(err)
        }
      
    
     var obj_ = body;
     //obj.messege.sort
     
      //return console.log(obj_)
     if (obj_.message === 'No results for the given CCC Number were found') 
     {
            var l = {
              viral_load:'Not Available',
          }

     }else
     {
      var obj2 = obj_.results;
    
            obj2.sort((a, b) => {
                return new Date(b.lab_order_date) - new Date(a.lab_order_date); // ascending
            }); 
            var sp_status=[];
            

            obj2.forEach(obj => {
              Object.entries(obj).forEach(([key, value]) => {
             //Loop through the result set from mLab
                  if(key=='result_content')
                  {
                    // console.log(`${value}`);
                  var value_=value;
                    if(value_=='')
                    {
                    // sp_status='';
                    }else
                    {
                  
                  if (value_.includes('LDL')) {            
                      sp_status.push('VS')
                      //console.log(sp_status);
                  } else {
                    if(value_<200)
                    {
                      sp_status.push('VS')
                    }else
                    {
                      sp_status.push('UVS')

                    }
                   
                  }
                }
                  }
              });
            

          });
         
          if(sp_status[0]=='VS')
          {
            var viral_load__='Viral Suppressed';
          }else
          {
            var viral_load__='Viral Unsuppressed';

          }

          var l = {
            viral_load:viral_load__
        }
     }
     var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'VL_RESULTS'});

  
        return res
      .status(200)
      .json({
          success: true,
          msg: l,
          //msg2: body,
      });

      });
      

    
    }else
    {
      return res
      .status(500)
      .json({
          success: false,
          msg: 'No VL Records Found',
      });

    }

  }else{

    return res
      .status(500)
      .json({
          success: false,
          msg: 'No VL Records Found',
      });
      } 
 
});


router.get('/vl_results', async(req, res) =>  {
  const userid = req.query.user_id;
  
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  console.log(base64.decode(userid));
  
  //Check if we already have an existing reschedule request

   //Search if Program Details Exist
   let check_ccc_no= await NUserprograms.findOne({
    where: {
      [Op.and]: [
        { user_id: base64.decode(userid) },
        { program_type: '1'}, // Set 1 for HIV program
        { is_active: '1'} // Set 1 for HIV program
      ]
    }
  });
 // console.log(check_ccc_no);
  if(check_ccc_no)
  {

    //Get Client Details
    let check_program_valid= await Client.findOne({
      where: {
        id: check_ccc_no.program_identifier
     }
    });

  
    if(check_program_valid)
    {
      //Call mLab Instance
      console.log(check_program_valid.clinic_number);
     client_payload='{"ccc_number": "'+check_program_valid.clinic_number+'"}';
     //client_payload='{"ccc_number": "1409101178"}';
      const url_details = {
        url: process.env.MLAB_URL,
        json: true,
        body: JSON.parse(client_payload),
        "rejectUnauthorized": false,

       
      }

      request.post(url_details, (err, res_, body) => {
        if (err) {
          return console.log(err)
        }
      
    
     var obj_ = body;
     var sp_status=[];

     //obj.messege.sort
     
     // return console.log(obj_)
     if (obj_.message === 'No results for the given CCC Number were found') 
     {
      sp_status.push('No VL Results Found')

     }else
     {
      var obj2 = obj_.results;
    
            obj2.sort((a, b) => {
                return new Date(b.date_collected) - new Date(a.date_collected); // ascending
            }); 
            

            obj2.forEach(obj => {
              
               var lab_order_date_=obj.date_collected;
               var result_type_=obj.units;
 
              
              Object.entries(obj).forEach(([key, value]) => {
             //Loop through the result set from mLab
             
                  if(key=='result_content')
                  {
                    // console.log(`${value}`);
                  var value_=value;
                    if(value_=='')
                    {
                    // sp_status='';
                    }else
                    {
                  
                  if (value_.includes('LDL')) {            
                      sp_status.push({result:'<LDL copies/ml', status: 'Viral Suppressed', date: lab_order_date_ , plot: parseInt(49)})
                      //console.log(sp_status);
                  } else {
                    if(value_.replace(/[^0-9]/g, '')<200)
                    {
                      sp_status.push({result:value_.replace(/[^0-9]/g, '')+' copies/ml', status: 'Viral Suppressed', date: lab_order_date_,  plot: parseInt(value_.replace(/[^0-9]/g, ''))})

                     
                    }else
                    {
                      sp_status.push({result:value_.replace(/[^0-9]/g, '')+' copies/ml', status: 'Viral unsuppressed', date: lab_order_date_ , plot: parseInt(value_.replace(/[^0-9]/g, ''))})

                    }
                   
                  }
                }
                  }
              });
            
          });
         
        
     }
     var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'VL_RESULTS'});

  
        return res
      .status(200)
      .json({
          success: true,
          msg: sp_status,
          //msg2: body,
      });

      });

    
    }else
    {
      return res
      .status(500)
      .json({
          success: false,
          msg: 'No VL Records Found',
      });

    }

  }else{

    return res
      .status(500)
      .json({
          success: false,
          msg: 'No VL Records Found',
      });
      } 
 
});


//Function To Search EID Result


var eid_results_out=function(hei_no) {
  var return_variable=[];
  client_payload='{"ccc_number": "1607320220018"}';

  // client_payload='{"ccc_number": "'+hei_no+'"}';
     
     const url_details = {
       url: process.env.MLAB_URL,
       json: true,
       body: JSON.parse(client_payload),
       "rejectUnauthorized": false,      
     }
     var sp_status=[];

   request.post(url_details, (err, res_, body) => {
      if (err) {
        return console.log(err)
      }
         // return 'adasdad';

        //console.log(body.results);

        var obj_ = body;
        //console.log(obj_);

       // var sp_status=[];
      if (obj_.message === 'No results for the given CCC Number were found') 
      {
      // sp_status.push('No Results Found');
       sp_status=[];
 
      }else
      {
        //console.log(body.results);
        var obj2 = obj_.results;

        obj2.sort((a, b) => {
            return new Date(b.date_collected) - new Date(a.date_collected); // ascending
        }); 
        //  console.log(obj2);

        

        obj2.forEach(obj => {

        var lab_order_date_=obj.date_collected;
        var result_type_=obj.result_type;
        //Loop through Objects 

      Object.entries(obj).forEach(([key, value]) => {

        if(key=='result_content')
        {
          var value_=value;
          if(value_=='')
          {
            sp_status=[];

          }else
          {
            if(result_type_=='2'){ //Allow only for EID results
            sp_status.push({result:value_, result_type:'PCR Result', date: lab_order_date_ });
           
            }
          }
        }

      });
          

        });


        console.log(sp_status);
        return_variable=sp_status;
        
      }

     


      //
      
      //dependants_.push({dependant_name:dependants[i].dependant_name,d_age:dependants[i].dependant_age,d_results:sp_status});
    });
    return return_variable;
  }
  
  router.get('/eid_results', async(req, res) =>  {
  const userid = req.query.user_id;
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
      
     let  sql = `CALL sp_nishauri_dependants(?)`;
     let todo = [base64.decode(userid)];
      conn.query(sql,todo, (error, results, fields) => {
        if (error) {
            return console.error(error.message);
            conn.end();
          }
          //Console Log
         //console.log(results[0]);
         dependants=results[0];
         //console.log(dependants);

         var dependants_=[];
       
         for (var i in dependants) {
          //console.log(dependants[i].hei_no);
          //Loop Through EID Results
          var eidresults_=[];
          eidresults_= eid_results_out('jf');
          console.log(eidresults_);
     
          dependants_.push({dependant_name:dependants[i].dependant_name,d_age:dependants[i].dependant_age,d_results:eidresults_});

        }

        return res
        .status(200)
        .json({
          success: true,
           data: dependants_
       });

      conn.end();
      });

}catch(err){

} 
});


//Fetch Regimen
router.get('/regimen', async(req, res) =>  {
  const userid = req.query.user_id;
  
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  console.log(base64.decode(userid));
  
  //Check if we already have an existing reschedule request

   //Search if Program Details Exist
   let check_ccc_no= await NUserprograms.findOne({
    where: {
      [Op.and]: [
        { user_id: base64.decode(userid) },
        { program_type: '1'}, // Set 1 for HIV program
        { is_active: '1'} // Set 1 for HIV program
      ]
    }
  });
 // console.log(check_ccc_no);
  if(check_ccc_no)
  {

    //Get Client Details
    let check_program_valid= await Client.findOne({
      where: {
        id: check_ccc_no.program_identifier
     }
    });

  
    if(check_program_valid)
    {
      //Call mLab Instance
     // client_payload='{"ccc_number": "'+check_program_valid.clinic_number+'"}';
    // http://prod.kenyahmis.org:8002/api/patient/1234567890/regimen
      //request.get(process.env.ART_URL+'1234567890/regimen', (err, res_, body) => {

      request.get(process.env.ART_URL+'patient/'+check_program_valid.clinic_number+'/regimen', (err, res_, body) => {
        if (err) {
          return console.log(err)
        }
       // res_.send(err);
       // return console.log(body)
       var obj = JSON.parse(body);
      return res
      .status(200)
      .json({
          success: true,
          msg: obj.message,
      });

      });
      

    
    }else
    {
      return res
      .status(500)
      .json({
          success: false,
          msg: 'Regimen Records Found',
      });

    }

  }else{

    return res
      .status(500)
      .json({
          success: false,
          msg: 'Regimen Records Found',
      });
      } 
 
});


//Fetch Regimen
router.get('/artdirectory', async(req, res) =>  {
  const art_search = req.query.search;
  const userid = req.query.user_id;

  //console.log(art_search);

  
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  //console.log(base64.decode(userid));
  if(!isNaN(art_search))
  {
    var param_search_num=art_search;
    var param_search_string='xx';

  }else
  {
    var param_search_string=art_search;
    var param_search_num='99999999';


  }
  
  console.log(param_search_num);
  console.log(param_search_string);
  //Search ART directory from 
   request.get(process.env.ART_URL+'directory/'+param_search_num+'/'+param_search_string, (err, res_, body) => {
        if (err) {
          return console.log(err)
        }
       //res_.send(err);
       //return console.log(body)
       var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'ARTDIRECTORY'});

       var obj = JSON.parse(body);
      return res
      .status(200)
      .json({
          success: true,
          msg: obj.message,
      });

      });
      
});


//Fetch Dependants 

router.get('/dependants',  async (req, res) => {
  const userid = req.query.user_id;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_nishauri_dependants(?)`;
           let todo = [base64.decode(userid)];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});

//Fetch Dependants 

router.post('/bmi_calculator',  async (req, res) => {
  heigh = parseFloat(req.body.height);
  weigh = parseFloat(req.body.weight);
  const userid = req.body.user_id;

  //bmi = weigh / (heigh * heigh);

  //number to string format

 // bmi = weigh/(heigh*heigh) 
    //if (heigh<=3){
  //    weigh=weigh
  //  } else if (heigh>3 && heigh<10){
  //    heigh=(heigh/3.281)
  //  } else{
  //    heigh=(heigh/100)
  //  }
    bmi = weigh/((heigh*heigh) / 10000);
    bmi = bmi.toFixed(2)
    //bmi = bmi.toFixed();

  //req_name = req.body.Name;

  // CONDITION FOR BMI
  if (bmi < 18.5) {
      var l = {
        bmi:bmi,
        comment:'Underweight',
    }
     
  } else if (18.5 <= bmi && bmi < 25) {
    var l = {
      bmi:bmi,
      comment:'Normalweight',
  }
    
  } else if (25 <= bmi && bmi < 30) {
    var l = {
      bmi:bmi,
      comment:'Overweight',
  }
      
  } else {
    var l = {
      bmi:bmi,
      comment:'Obese',
  }
     
  }

  var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'BMICALCULATOR'});


  return res
  .status(200)
  .json({
      success: true,
      msg: l,
  });
});



router.post('/chat', async (req, res) => {
    const question_ = req.body.question;
    const userid = req.body.user_id;
    var dataToSend;
    var log_activity_ = NLogs.create({ user_id: base64.decode(userid), access: 'CHAT' });

    let { PythonShell } = require('python-shell');
    let options = {
        mode: 'text',
        pythonOptions: ['-u'], // get print results in real-time
        args: [question_],
       scriptPath: './routes/processes/'
    };


    //Upload file first

    PythonShell.run('nishauri_chatbot.py', options).then(messages => {
        // results is an array consisting of messages collected during execution
        console.log('results: %j', messages);


        res.status(200).json({
            success: true,
            msg: messages.toString(),
            question:question_
        });
    });
    
//}));

  // spawn new child process to call the python script
// const python = spawn('python3', ['./routes/processes/nishauri_chatbot.py',question_]);

 //python.stdout.on('data', function (data) {
  //console.log('Pipe data from python script ...'.data);
  //dataToSend = data.toString();
 //});
 // in close event we are sure that stream from child process is closed
 //python.on('close', (code) => {
 //console.log(`child process close all stdio with code ${code}`);
 // send data to browser

   // res.status(200).json({
    // success: true,
     // msg: dataToSend,
    // question:question_
 //});

 //});
   
});


//Fetch  Appointment From CCC Number
router.get('/appointments',  async (req, res) => {
  const ccc_no = req.query.ccc_no;
  //console.log(userid);
  
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
            
           let  sql = `CALL sp_dawa_drop_appt(?)`;
           let todo = [ccc_no];
            conn.query(sql,todo, (error, results, fields) => {
              if (error) {
                  return console.error(error.message);
                  conn.end();
                }
               // console.log(results);
               //Log Activity
              // var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'APPOINTMENTS'});
                return res
                 .status(200)
                 .json({
                   success: true,
                    data: results[0]
                });

            conn.end();
            });

      }catch(err){
  
      }
  
});




///Client Survey
//Manages Access to client Survey endpoints
function getAccessToken(url, callback) {
  var token='';
  auth_payload='{"msisdn": "'+process.env.PSURVEY_USER+'", "password": "'+process.env.PSURVEY_PASSWORD+'"}';
  const url_details = {
    url: process.env.PSURVEY_URL+'auth/token/login',
    json: true,
    body: JSON.parse(auth_payload)
  }
  request.post(url_details, function (err, httpResponse, body) { 
      //return token=httpResponse.body;

     //console.log(httpResponse);
      var statusCode = httpResponse.statusCode;
      finalData = httpResponse.body;
      
      callback(finalData);
      // we are done
      return;
  })

}

router.post("/getactive_q_list", async (req, res) => {

  //Get Passed Values
  const userid = req.body.user_id;

  //Get Token
  var token_generated_='';
  var verified_data='';
var check_program_valid='';
  let check_ccc_no= await NUserprograms.findOne({
    where: {
      [Op.and]: [
        { user_id: base64.decode(userid) },
        { program_type: '1'}, // Set 1 for HIV program
        { is_active: '1'} // Set 1 for HIV program
      ]
    }
  });
 // console.log(check_ccc_no);
  if(check_ccc_no)
  {

    //Get Client Details
     check_program_valid= await Client.findOne({
      where: {
        id: check_ccc_no.program_identifier
     }
    });
  }

  getAccessToken('url_invalid',function(token_generated){
      //Parse Token
    // console.log(token_generated);
     // parsedBody= JSON.parse(token_generated);
      token_generated_=token_generated.auth_token;
     // console.log(token_generated_); 
    //Call Active Surveys Endpoints
  request.get(process.env.PSURVEY_URL+'api/current/user/'+check_program_valid.mfl_code+'/'+check_program_valid.clinic_number,{ 'headers':{
    'Authorization':'Token '+token_generated_
  }} , function (err, respond) {
      console.log(token_generated_); 

      //console.log(respond); 
      //console.log(verified_data); 
      if(res.statusCode==400)
      {
       res.send(respond);
      
      }else if (res.statusCode==200)
      {
          verified_data=JSON.parse(respond.body);
          res.send(verified_data);

      }else if(res.statusCode==500)
      {

       res.send(respond);

     }else if(res.statusCode==401)
     {
       res.send(respond);

      }  
     //res.send(respond);
  });

  });

});


router.post("/getactive_q", async (req, res) => {

  //Get Passed Values
  const userid = req.body.user_id;

  //Get Token
  var token_generated_='';
  var verified_data='';
  var check_program_valid='';
  let check_ccc_no= await NUserprograms.findOne({
    where: {
      [Op.and]: [
        { user_id: base64.decode(userid) },
        { program_type: '1'}, // Set 1 for HIV program
        { is_active: '1'} // Set 1 for HIV program
      ]
    }
  });
 // console.log(check_ccc_no);
  if(check_ccc_no)
  {

    //Get Client Details
     check_program_valid= await Client.findOne({
      where: {
        id: check_ccc_no.program_identifier
     }
    });
  }

  getAccessToken('url_invalid',function(token_generated){
      //Parse Token
     //console.log(token_generated);
     // parsedBody= JSON.parse(token_generated);
      token_generated_=token_generated.auth_token;
     // console.log(token_generated_); 
    //Call Active Questionnaire Endpoint
  request.get(process.env.PSURVEY_URL+'api/questionnaire/active/'+check_program_valid.mfl_code+'/'+check_program_valid.clinic_number,{ 'headers':{
    'Authorization':'Token '+token_generated_
  }} , function (err, respond) {
     // console.log(token_generated_); 

      //console.log(respond); 
      //console.log(verified_data); 
      if(res.statusCode==400)
      {
       res.send(respond);
      
      }else if (res.statusCode==200)
      {
          verified_data=JSON.parse(respond.body);
          res.send(verified_data);

      }else if(res.statusCode==500)
      {

       res.send(respond);

     }else if(res.statusCode==401)
     {
       res.send(respond);

      }else
      {
        res.send(respond);
      }  
     //res.send(respond);
  });

  });

});


router.post("/start_q", async (req, res_) => {

  //Get Passed Values
  const userid = req.body.user_id;
  const questionnaire_id_ = req.body.questionnaire_id;
  const ccc_number_ = req.body.ccc_number;
  const first_name_ = req.body.first_name;
  const questionnaire_participant_id_= req.body.questionnaire_participant_id;
  const interviewer_statement_ = req.body.interviewer_statement;
  const informed_consent_ = req.body.informed_consent;
  const privacy_policy_ = req.body.privacy_policy;

  post_payload='{"questionnaire_id": "'+questionnaire_id_+'", "ccc_number": "'+ccc_number_+'", "first_name": "'+first_name_+'", "questionnaire_participant_id": "'+questionnaire_participant_id_+'", "interviewer_statement": "'+interviewer_statement_+'",'
  +'"informed_consent": "'+informed_consent_+'", "privacy_policy": "'+privacy_policy_+'"}';

  //Get Token
  var token_generated_='';
  var verified_data='';

  getAccessToken('url_invalid',function(token_generated){
      //Parse Token
     //console.log(token_generated);
     // parsedBody= JSON.parse(token_generated);
      token_generated_=token_generated.auth_token;
 
    const url_details = {
      url: process.env.PSURVEY_URL+'api/questionnaire/start/',
      json: true,
      body: JSON.parse(post_payload),
      headers:{
        'Authorization':'Token '+token_generated_
      }
    }

    request.post(url_details, (err, res, body) => {
      if (err) {
        return console.log(err)
      }
    // console.log(res.body)
     if(res.statusCode==400)
     {
      res_.send(body);
     
     }else if (res.statusCode==200)
     {
    
     //const body_ = JSON.parse(body);

     //var link=body_[0]['link'];
     //var session=body_[0]['session'];
     //let json = JSON.parse(body);

     // console.log(body.link);
      const urlParts =body.link.split('/');
      const q_id=urlParts[urlParts.length-1];

      let return_ = {
        link: parseInt(q_id),
        session: body.session
        };
   
      res_.send(return_);

     }else if(res.statusCode==500)
     {
      res_.send(body);
    }else if(res.statusCode==401)
    {
      res_.send(body);

     }
    // res_.send(body);

    })

  });

});


router.post("/next_q", async (req, res) => {

  //Get Passed Values
  const userid = req.body.user_id;
  const next_q_ = req.body.next_q;
  const session_ = req.body.session;
  //const question_ = req.body.question;
  //const answer_ = req.body.answer;
  //const open_text_ = req.body.open_text;



  //Get Token
  var token_generated_='';
  var verified_data='';

  getAccessToken('url_invalid',function(token_generated){
      //Parse Token
     //console.log(token_generated);
     // parsedBody= JSON.parse(token_generated);
      token_generated_=token_generated.auth_token;
     // console.log(token_generated_); 
    //Call Session ID Endpoint
  request.get(process.env.PSURVEY_URL+'api/questions/answer/'+next_q_+'/'+session_,{ 'headers':{
    'Authorization':'Token '+token_generated_
  }} , function (err, respond) {
     // console.log(token_generated_); 

      //console.log(respond); 
      //console.log(verified_data); 
      if(res.statusCode==400)
      {
       res.send(respond);
      
      }else if (res.statusCode==200)
      {
        console.log(respond.body);
          verified_data=JSON.parse(respond.body);
          res.send(verified_data);

      }else if(res.statusCode==500)
      {

       res.send(respond);

     }else if(res.statusCode==401)
     {
       res.send(respond);

      }  
     //res.send(respond);
  });

  });

});


router.post("/q_answer", async (req, res) => {

  //Get Passed Values
  console.log(req.body.session);

  const userid = req.body.user_id;
  const session_ = req.body.session;
  const question_ = req.body.question;
  const answer_ = req.body.answer;
  const open_text_ = req.body.open_text;

    post_payload='{"session": "'+session_+'", "question": "'+question_+'", "answer": "'+answer_+'", "open_text": "'+open_text_+'"}';
    console.log(post_payload);

 
  //Get Token
  var token_generated_='';
  var verified_data='';

  getAccessToken('url_invalid',function(token_generated){
      //Parse Token
      //console.log(token_generated);
      // parsedBody= JSON.parse(token_generated);
       token_generated_=token_generated.auth_token;
  
     const url_details = {
       url: process.env.PSURVEY_URL+'api/questions/answer/',
       json: true,
       body: JSON.parse(post_payload),
       headers:{
         'Authorization':'Token '+token_generated_
       }
     }
 
     request.post(url_details, (err, res_, body) => {
       if (err) {
         return console.log(err)
       }
     // console.log(res.body)
      if(res_.statusCode==400)
      {
        res.send(body);
      
      }else if (res_.statusCode==200)
      {
      // var link=body[0]['link'];
      // var session=body[0][''];
     // console.log(body);

      if(typeof body.link == "undefined"){
        // Assign value to the property here
        //Obj.property = someValue;
        res.send(body);

    }else{

      const urlParts =body.link.split('/');
     // console.log(urlParts);
      const q_id=urlParts[urlParts.length-1];
      const urlParts_pr =body.prevlink.split('/');
      const q_id_pr=urlParts_pr[urlParts_pr.length-2];

      let return_ = {
        prevlink: parseInt(q_id_pr),
        link: parseInt(q_id),
        session: parseInt(session_),
        };
   
        res.send(return_);

    }

     
       //res_.send(body);
 
      }else if(res_.statusCode==500)
      {

        res.send(body);

     }else if(res_.statusCode==401)
     {

      res.send(body);
 
      }
     // res_.send(body);
     })

  });

});


module.exports = router;