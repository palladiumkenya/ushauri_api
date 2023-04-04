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

    console.log(password_hash);
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
                //Show Page To Add CCC or Program Number
                var l = {
                    user_id: base64.encode(check_username.id),
                    page_id: 0,
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
                'destination': '0723863153',
                'msg': 'Dear Nishauri User, Your OTP for password reset is '+vOTP+'. Valid for the next 24 hours.',
                'sender_id': '0723863153',
                'gateway': process.env.SMS_SHORTCODE
            }
        }

        request.post(header_details,  (err, res, body) => {
        if(err)
        {
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







module.exports = router;