const { User } = require("../../models/user");
const express = require("express");
const router = express.Router();
const request = require('request');
//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const https = require('https');
require("dotenv").config();

const moment = require("moment");
const base64 = require("base64util");


//TOKEN Credentials
const client_secret = process.env.CLIENT_SECRET;
const grant_type = process.env.GRANT_TYPE;
const scope = process.env.SCOPE;
const client_id = process.env.CLIENT_ID;

//URLS
const token_url = process.env.TOKEN_URL;
const verify_url = process.env.VERIFY_URL;
const search_url = process.env.SEARCH_URL;
const post_url = process.env.POST_URL;




function getAccessToken(url, callback) {
    var token='';
    request.post({
        url: token_url,
        form: {
            client_secret: client_secret,
            grant_type: grant_type,
            scope: scope,
            client_id: client_id
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      }, function (err, httpResponse, body) { 
        //return token=httpResponse.body;
        var statusCode = httpResponse.statusCode;
        finalData = httpResponse.body;
        
        callback(finalData);
        // we are done
        return;
    })
   // return;
     //console.log(token_generated);

}


router.post("/verify", async (req, res) => {

    //Get Passed Values
    const identifier = req.body.identifier;
    const value = req.body.identifier_value;

    //res.send(verified_data);
    //Get Token
    var token_generated_='';
    var verified_data='';

    getAccessToken('url_invalid',function(token_generated){
        //Parse Token
        parsedBody= JSON.parse(token_generated);
        token_generated_=parsedBody.access_token;
      //Call Verification Endpoint
    request.get(verify_url+identifier+'/'+value,{ 'auth':{
        'bearer': token_generated_
      }} , function (err, respond) {
        verified_data=JSON.parse(respond.body)
        //console.log(verified_data); 
        
        res.send(verified_data);
    });

    });
  
});

//Post UPI details



router.post("/getUPI", async (req, res_) => {

    //Get Passed Values

    const reg_payload = req.body.reg_payload;

   const user_mfl = req.body.user_mfl;
   message=reg_payload;

        message = message.split("*");
        message = message[1];

        message = message.split("#");

        let decoded_message = await base64.decode(message[0].trim());

        decoded_message = "Reg*" + decoded_message;


        const variables = decoded_message.split("*");
      //  console.log(variables.length);
        if (variables.length != 30)
            return {
                code: 400,
                message: variables.length
            };

            const reg = variables[0]; //CODE = REG : REGISTRATION 1
            const upn = variables[1]; //UPN/CCC NO 2
            const serial_no = variables[2]; //SERIAL NO 3
            const f_name = variables[3]; //FIRST NAME 4
            const m_name = variables[4]; //MIDDLE NAME 5
            const l_name = variables[5]; //LAST NAME 6
            let dob = variables[6]; //DATE OF BIRTH 7
            const national_id = variables[7]; //NATIONAL ID OR PASSOPRT NO 8
            const upi_no = variables[8]; //MOH UPI NUMBER
            const birth_cert_no = variables[9]; //MOH UPI NUMBER
            const gender = variables[10]; //GENDER 9
            const marital = variables[11]; //MARITAL STATUS 10
            let condition = variables[12]; //CONDITION 11
            let enrollment_date = variables[13]; //ENROLLMENT DATE 12
            let art_start_date = variables[14]; //ART START DATE 13
            const primary_phone_no = variables[15]; //PHONE NUMBER 14
            const alt_phone_no = variables[16]; //PHONE NUMBER 14
            const trtmnt_buddy_phone_no = variables[17]; //PHONE NUMBER 14
            let language = variables[18]; //LANGUAGE 16
            let sms_enable = variables[19]; //SMS ENABLE 15
            const motivation_enable = variables[20]; //MOTIVATIONAL ALERTS ENABLE 18
            const messaging_time = variables[21]; //MESSAGING TIME 17
            const client_status = variables[22]; //CLIENT STATUS 19
            const transaction_type = variables[23]; //TRANSACTION TYPE 20
            const grouping = variables[24]; //GROUPING
            let locator_county = variables[25]; //LOCATOR COUNTY INFO
            let locator_sub_county = variables[26]; //LOCATOR SUB COUNTY INFO
            let locator_ward = variables[27]; //LOCATOR WARD INFO
            let locator_village = variables[28]; // LOCATOR VILLAGE INFO
            let locator_location = variables[29]; //LOCATOR LOCATION

        //const mfl_code = user.facility_id;
        //const mfl_code = user_mfl;
        const mfl_code = '15205';


        //const clinic_id = user.clinic_id;
        //const partner_id = user.partner_id;
        //const user_id = user.id;

        let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

        if (!upn) return {
            code: 400,
            message: "Clinic Number not provided"
        };
        if (!f_name) return {
            code: 400,
            message: "First Name not provided"
        };
        if (!l_name) return {
            code: 400,
            message: "Last Name not provided"
        };
        if (!dob) return {
            code: 400,
            message: "Date of Birth not provided"
        };
        if (enrollment_date != '-1') {
            enrollment_date = moment(enrollment_date, "DD/MM/YYYY").format("YYYY-MM-DD");
        }
    
        if (art_start_date != "-1") {
            art_start_date = moment(art_start_date, "DD/MM/YYYY").format("YYYY-MM-DD");
        }
        if (dob != "-1") {
            dob = moment(dob, "DD/MM/YYYY").format("YYYY-MM-DD");
        }
    
        var b = moment(new Date());
        var diffDays = b.diff(dob, "days");
       // console.log(diffDays)
        let group_id;
        if (diffDays >= 3650 && diffDays <= 6935) {
            //Adolescent
            group_id = 2;
        } else if (diffDays >= 7300) {
            //Adult
            group_id = 1;
        } else {
            //Paeds
            group_id = 3;
        }
        if (parseInt(sms_enable) == 1) {
            sms_enable = "Yes";
        } else if (parseInt(sms_enable) == 2) {
            sms_enable = "No";
        }
        if (parseInt(condition) == 1) {
            condition = "ART";
           upi_art=true;
           upi_ccc=upn;
        } else if (parseInt(condition) == 2) {
            condition = "Pre-Art";
            art_start_date = null;
            upi_art=false;
            upi_ccc='';


        }

        let status;
        if (client_status != "-1") {
            if (parseInt(client_status) == 1) {
                status = "Active";
            } else if (parseInt(client_status) == 2) {
                status = "Disabled";
            } else if (parseInt(client_status) == 3) {
                status = "Deceased";
            } else if (parseInt(client_status) == 4) {
                status = "Transfer Out";
            }
        }
        let motivational_enable;
        if (parseInt(motivation_enable) == 1) {
            motivational_enable = "Yes";
        } else if (parseInt(motivation_enable) == 2) {
            motivational_enable = "No";
        }
        let client_type;
        if (transaction_type == 3) {
            client_type = "Transfer";
        } else if (transaction_type == 1) {
            client_type = "New";
        }

        //Generate UPI Indentification Type and Numbers
        if(national_id !="")
        {
          identification_type='national-id';
          identification_value=national_id;
        }else
        {
          identification_type='birth-certificate';
          identification_value=birth_cert_no;
 
        }


    client_payload='{"clientNumber": "", "firstName": "'+f_name+'", "middleName": "'+m_name+'", "lastName": "'+l_name+'", "dateOfBirth": "'+dob+'",'
      +'"maritalStatus": "single", "gender": "female","occupation": "", "religion": "", "educationLevel": "","country": "KE", '
      +'"countyOfBirth": "012", "isAlive": true, "originFacilityKmflCode": "'+mfl_code+'", "isOnART":  '+upi_art+',  "nascopCCCNumber": "'+upi_ccc+'",'
      + '"residence": { "county": "039", "subCounty": "kimilili","ward": "kamukuywa", "village": "'+locator_village+'", "landMark": "", "address": "" },'
     +' "identifications": [ { "countryCode": "KE", "identificationType": "'+identification_type+'", "identificationNumber": "'+identification_value+'" }],'
     +'"contact": { "primaryPhone": "'+primary_phone_no+'", "secondaryPhone": "", "emailAddress": "" },'
     +' "nextOfKins": []}';

   //res.send(JSON.parse(client_payload));

      var token_generated_='';
    var verified_data='';

    getAccessToken('url_invalid',function(token_generated){
        //Parse Token
        parsedBody= JSON.parse(token_generated);
        token_generated_=parsedBody.access_token;
      //Call Verification Endpoint
     

      const url_details = {
        url: post_url,
        json: true,
        body: JSON.parse(client_payload),
        auth: {
        'bearer': token_generated_
          //'bearer': 'adsdasdsad'
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
        res_.send(body);

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
module.exports = router;
