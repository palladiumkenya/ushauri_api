const { User } = require("../../models/user");
const express = require("express");
const router = express.Router();
const request = require('request');
const moment = require("moment");



generateOtp = function (size) {
  const zeros = '0'.repeat(size - 1);
  const x = parseFloat('1' + zeros);
  const y = parseFloat('9' + zeros);
  const confirmationCode = String(Math.floor(x + Math.random() * y));
return confirmationCode;
}

router.post("/", async (req, res) => {
  const phone = req.body.phone_no;

  let today = moment(new Date().toDateString()).format("YYYY-MM-DD");


  //Make OTP optional to support only production
  if(req.body.otp !== undefined) {
    var otp_ = true;
  }else{
    var otp_ = false;
  }

  //check user phone number and mfl_code and clinic

  let user = await User.findOne({ where: { phone_no: phone } });

  if (!user){
    res
      .status(400)
      .send(`Phone Number: ${phone} is not registered in the system`);
  }else
  {
    if(otp_==true)
    {
  
       //Generate OTP and send to facility
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
               'destination': phone,
               'msg': 'Dear Ushauri Facility, Your OTP to complete user account is '+vOTP+'. Valid for the next 24 hours.',
               'sender_id': phone,
               'gateway': process.env.SMS_SHORTCODE
           }
       }

       request.post(header_details,  (err, res_, body) => {
       if(err)
       {
            //Error Sending OTP
            res
            .status(400)
            .send(`Error sending OTP`);
       }   
       });

        //Save OTP Details
        const log_OTP = await User.update(
           { account_otp_date: today, account_otp_number: vOTP},
           { where: {  phone_no: phone } }
         );

    
         let result = {};

         result.result = [{ mfl_code: user.facility_id }, { otp: vOTP }];
         //Send out OTP to the facility number
         res.status(200).send(result);
    }else
    {
      let result = {};

      result.result = [{ mfl_code: user.facility_id }, { otp: '' }];
      //Send out OTP to the facility number
      res.status(200).send(result);
    }
  }
});


//Verify OTP Details
router.post('/verifyotp', async(req, res) =>  {
  const phone = req.body.phone_no;
  const otp_ = req.body.otp;
  
  //Check If User Exists
  let check_username= await User.findOne({
      where: {
        [Op.and]: [
          { account_otp_number: otp_},
          { phone_no: phone }
        ]
      }
    });


    if(check_username)
    {
      let result = {};

      result.result = [{ mfl_code: user.facility_id }, { otp: '' }];
      //Send out OTP to the facility number
      res.status(200).send(result);
      
      
  
    }else{
      //Verification 
      res
      .status(400)
      .send(`Invalid or Expired OTP`);
    }
 
});
module.exports = router;
