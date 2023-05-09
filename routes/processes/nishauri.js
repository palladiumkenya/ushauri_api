const express = require("express");
const router = express.Router();
const request = require('request');
const https = require('https');
const moment = require("moment");
const base64 = require("base64util");
require("dotenv").config();
//const Op = require("sequelize");
const { Op } = require("sequelize");
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
router.post('/setprogram', async(req, res) =>  {
    let ccc_no = req.body.ccc_no;
    let upi_no = req.body.upi_no;
    let firstname = req.body.firstname;
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
      let check_username= await NUsers.findOne({
        where: {
          [Op.and]: [
            { is_active: '0'},
            { id: base64.decode(user_id) }
          ]
        }
      });

      

    //User Is Not Active
    //Validate Program In HIV
   let check_program_valid= await Client.findOne({
       where: {
         [Op.and]: [
           { f_name: firstname},
           { clinic_number: ccc_no}
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
        .status(500)
        .json({
            success: false,
            msg: 'An error occurred, could not create appointment reschedule request',
        });
    }

  }else{

    //Return Appointment Reschedule Already exist
       //Show Error Message 
       return res
       .status(500)
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
     client_payload='{"ccc_number": "'+check_program_valid.clinic_number+'"}';
     // client_payload='{"ccc_number": "1409101178"}';
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
                    if(value_<1000)
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
            var viral_load__='Viral UnSuppressed';

          }

          var l = {
            viral_load:viral_load__
        }
     }
  
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
                      sp_status.push({result:'<LDL copies/ml', status: 'Viral Suppressed', date: lab_order_date_ })
                      //console.log(sp_status);
                  } else {
                    if(value_<1000)
                    {
                      sp_status.push({result:value_+' '+result_type_, status: 'Viral UnSuppressed', date: lab_order_date_ })

                     
                    }else
                    {
                      sp_status.push({result:value_+' '+result_type_, status: 'Viral Suppressed', date: lab_order_date_ })

                    }
                   
                  }
                }
                  }
              });
            
          });
         
        
     }
  
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
  //console.log(art_search);

  
  let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");
  //console.log(base64.decode(userid));
  if(!isNaN(art_search))
  {
    var param_search_num=art_search;
    var param_search_string='';

  }else
  {
    var param_search_string=art_search;
    var param_search_num='';


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
  //bmi = weigh / (heigh * heigh);

  //number to string format

  bmi = weigh/(heigh*heigh) 
    if (heigh<=3){
      weigh=weigh
    } else if (heigh>3 && heigh<10){
        height=(heigh/3.281)
    } else{
      heigh=(heigh/100)
    }
    bmi = weigh/((heigh*heigh) / 10);
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

  return res
  .status(200)
  .json({
      success: true,
      msg: l,
  });
});



router.post('/chat', async(req, res) =>  {
  const question_ = req.body.question;

  
  client_payload='{"question": "'+question_+'"}';
  const url_details = {
    url: process.env.CHAT_URL,
    json: true,
    body: JSON.parse(client_payload),
    "rejectUnauthorized": false,
  }
  request.post(url_details, (err, res_, body) => {
    if (err) {
      return console.log(err)
    }
  

 //var obj_ = body;
 var obj = JSON.parse(body);
 return res
 .status(200)
 .json({
     success: true,
     msg: obj.response,
 });
 //var sp_status=[];
  });

});

  




module.exports = router;