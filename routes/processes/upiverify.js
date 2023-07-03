const {
    Client
} = require("../../models/client");
const { User } = require("../../models/user");
const {
    County
} = require("../../models/counties");
const {
    SCounty
} = require("../../models/sub_counties");


const {
    Ward
} = require("../../models/wards");

const {
    Log_upi
} = require("../../models/log_upi");

const {
    Country
} = require("../../models/countries");
const express = require("express");
const router = express.Router();
const request = require('request');
//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const https = require('https');
require("dotenv").config();
const _ = require("lodash");

const moment = require("moment");
const base64 = require("base64util");


//TOKEN Credentials
const client_secret = process.env.CLIENT_SECRET;
const grant_type = process.env.GRANT_TYPE;
const scope = process.env.SCOPE;
const scope_verify = process.env.SCOPE;
const client_id = process.env.CLIENT_ID;

//URLS
const token_url = process.env.TOKEN_URL;
const verify_url = process.env.VERIFY_URL;
const search_url = process.env.SEARCH_URL;
const post_url = process.env.POST_URL;
const error_url = process.env.GET_ERROR_LIST;
const error_update_url = process.env.UPDATE_ERROR_LIST;




function getAccessTokenErrorList(url, callback) {
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
       // console.log(httpResponse.body);
        var statusCode = httpResponse.statusCode;
        finalData = httpResponse.body;
        
        callback(finalData);
        // we are done
        return;
    })

}


function getAccessTokenError(url, callback) {
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
       // console.log(httpResponse.body);
        var statusCode = httpResponse.statusCode;
        finalData = httpResponse.body;
        
        callback(finalData);
        // we are done
        return;
    })

    
   // return;
     //console.log(token_generated);

}


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

function getAccessToken_verify(url, callback) {
  var token='';
  request.post({
      url: token_url,
      form: {
          client_secret: client_secret,
          grant_type: grant_type,
          scope: scope_verify,
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
    //Get Token
    var token_generated_='';
    var verified_data='';

    getAccessToken_verify('url_invalid',function(token_generated){
        //Parse Token
      //  console.log(token_generated);
        parsedBody= JSON.parse(token_generated);
        token_generated_=parsedBody.access_token;
        //console.log(token_generated_); 
      //Call Verification Endpoint
    request.get(verify_url+identifier+'/'+value,{ 'auth':{
        'bearer': token_generated_
      }} , function (err, respond) {
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
        if (variables.length != 32)
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
            let citizenship = variables[25]; //LOCATOR COUNTY INFO
            let county_birth = variables[26]; //LOCATOR COUNTY INFO
            let locator_county = variables[27]; //LOCATOR COUNTY INFO
            let locator_sub_county = variables[28]; //LOCATOR SUB COUNTY INFO
            let locator_village = variables[29]; // LOCATOR VILLAGE INFO

            let locator_ward = variables[30]; //LOCATOR WARD INFO
            let locator_location = variables[31]; //LOCATOR LOCATION

        //const mfl_code = user.facility_id;
        const mfl_code = user_mfl;
        //const mfl_code = '15205';


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

        if (parseInt(gender) == 1) {
            upi_gender = "female";
        } else if (parseInt(gender) == 2) {
            upi_gender = "male";
        }else
        {
            upi_gender = "unspecified";

        }


        //Citizenship Code
        const country = await Country.findByPk(citizenship);
        if (!_.isEmpty(country))
        {
            upi_citizen=country.code;
        }else
        {
            upi_citizen='';


        }
        //County of Birth
        const county_birth_ = await County.findByPk(county_birth);
        if (!_.isEmpty(county_birth_))
        {
            upi_c_birth=county_birth_.code;
        }else
        {
            upi_c_birth='';


        }
        //County of Residence
        const county_residence = await County.findByPk(locator_county);
        if (!_.isEmpty(county_residence))
        {
            upi_c_residence=county_residence.code;
        }else
        {
            upi_c_residence='';

        }
        //Sub-County
        const scounty_residence = await SCounty.findByPk(locator_sub_county);
        if (!_.isEmpty(scounty_residence))
        {
            upi_sc_res=scounty_residence.value_upi;
        }else
        {
            upi_sc_res='';

        }
        //Ward
        const ward_residence = await Ward.findByPk(locator_ward);
        if (!_.isEmpty(ward_residence))
        {
            upi_ward_res=ward_residence.value_upi;
        }else
        {
            upi_ward_res='';
        }




        if (parseInt(marital) == 1) {
            upi_marital = "single";
        } else if ((parseInt(marital) == 2)|| (parseInt(marital) == 8)) {
            upi_marital = "married";

        }else if (parseInt(marital) == 3) {
            upi_marital = "divorced";
        
        } else if (parseInt(marital) == 4) {
            upi_marital = "widowed";
        }else
        {
            upi_marital = "unknown";
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
        if(national_id !="-1")
        {
          identification_type='national-id';
          identification_value=national_id;
        }else
        {
          identification_type='birth-certificate';
          identification_value=birth_cert_no;
 
        }
//console.log(upi_sc_res);
//console.log(upi_ward_res);

    client_payload='{"clientNumber": "", "firstName": "'+f_name+'", "middleName": "'+m_name+'", "lastName": "'+l_name+'", "dateOfBirth": "'+dob+'",'
      +'"maritalStatus": "'+upi_marital+'", "gender": "'+upi_gender+'","occupation": "", "religion": "", "educationLevel": "","country": "'+upi_citizen+'", '
      +'"countyOfBirth": "'+upi_c_birth+'", "isAlive": true, "originFacilityKmflCode": "'+mfl_code+'", "isOnART":  '+upi_art+',  "nascopCCCNumber": "'+upi_ccc+'",'
      + '"residence": { "county": "'+upi_c_residence+'", "subCounty": "'+upi_sc_res.toLowerCase()+'","ward": "'+upi_ward_res.toLowerCase()+'", "village": "'+locator_village.toLowerCase()+'", "landMark": "", "address": "" },'
     +' "identifications": [ { "countryCode": "'+upi_citizen+'", "identificationType": "'+identification_type+'", "identificationNumber": "'+identification_value+'" }],'
     +'"contact": { "primaryPhone": "'+primary_phone_no+'", "secondaryPhone": "", "emailAddress": "" },'
     +' "nextOfKins": []}';

   //res_.send(JSON.parse(client_payload));

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

      //Log Response
        var log_upi_=Log_upi.create({ mfl_code: mfl_code, response: JSON.stringify(body), payload:client_payload});
        //log_upi_.save();

     

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



//Fetch UPI Verification Error List
router.post("/geterrorlist", async (req, res) => {

    //Get Passed Values
    //const identifier = req.body.identifier;
    const phone_no = req.body.phone_no;
    let check_user = await User.findOne({
        where: {
            phone_no,
        },
        });
    let mfl_code=check_user['facility_id'];
    

    //res.send(verified_data);
    //Get Token
    var token_generated_='';
    var errorlist_data='';

    getAccessTokenError('url_invalid',function(token_generated){
        //Parse Token
       //console.log(token_generated); 
        parsedBody= JSON.parse(token_generated);
        token_generated_=parsedBody.access_token;

        //console.log(token_generated_);
       
      //Call Error List Endpoint
      request.get(error_url+mfl_code,{ 'auth':{
        'bearer': token_generated_
      }} , async function (err, respond) {
      
        if(res.statusCode==400)
        {
         res.send(respond);
        
        }else if (res.statusCode==200)
        {
           // res.send(respond);

            errorlist_data=JSON.parse(respond.body);
           
            //const error_nupi = new Array();
            //let client_detail_array =[];
            //console.log(errorlist_data['results']);
            //for(var i=0;i<errorlist_data['results'].length;i++){
                //Fetch Person Details
              //  let client_detail_one = new Array();
               //console.log(errorlist_data['results'][i]['clientNumber']);
               //Search Person Details Using NUPI
             //  let client_detail = await Client.findOne({
             //   where: {
              //      upi_no: errorlist_data['results'][i]['clientNumber']
             //   }, 
           //     attributes: ["id","clinic_number", "f_name","m_name", "l_name","upi_no"],
           // })
            
           //   if(!(client_detail==null)){
            //    client_detail_one={"person":[client_detail,{upi_no: errorlist_data['results'][i]['clientNumber'], error: errorlist_data['results'][i]['errorDescription']}]};
            //    client_detail_array.push(client_detail_one);
            //  }
          
          //  }
          // res.send(client_detail_array);
          res.send(errorlist_data);


        }else if(res.statusCode==500)
        {
 
         res.send(client_details);

       }else if(res.statusCode==401)
       {
         res.send(respond);
 
        }
    });

    });
  
});


//UpdateUPI Details

router.post("/getupdateUPI", async (req, res__) => {

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
      // console.log(variables.length);
        if (variables.length != 32)
            return {
                code: 400,
                message: variables.length
            };
        //console.log(variables);

            const reg = variables[0]; //CODE = REG : REGISTRATION 1
            const upn = variables[1]; //UPN/CCC NO 2
            const serial_no = variables[2]; //SERIAL NO 3
            const f_name = variables[3]; //FIRST NAME 4
            const m_name = variables[4]; //MIDDLE NAME 5
            const l_name = variables[5]; //LAST NAME 6
            let dob = variables[6]; //DATE OF BIRTH 7
            const national_id = variables[7]; //NATIONAL ID OR PASSOPRT NO 8
            //console.log(national_id);
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
            let citizenship = variables[25]; //LOCATOR COUNTY INFO
            let county_birth = variables[26]; //LOCATOR COUNTY INFO
            let locator_county = variables[27]; //LOCATOR COUNTY INFO
            let locator_sub_county = variables[28]; //LOCATOR SUB COUNTY INFO
            let locator_village = variables[29]; // LOCATOR VILLAGE INFO
            //console.log(dob);

            let locator_ward = variables[30]; //LOCATOR WARD INFO
            let locator_location = variables[31]; //LOCATOR LOCATION

            //const mfl_code = user.facility_id;
            const mfl_code = user_mfl;
            //const mfl_code = '15205';


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
                enrollment_date = moment(enrollment_date, "YYYY-MM-DD").format("YYYY-MM-DD");
            }
        
            if (art_start_date != "-1") {
                art_start_date = moment(art_start_date, "YYYY-MM-DD").format("YYYY-MM-DD");
            }
            if (dob != "-1") {
                dob = moment(dob, "YYYY-MM-DD").format("YYYY-MM-DD");
            }
        
            var b = moment(new Date());
            var diffDays = b.diff(dob, "days");
            console.log(dob)
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

            if (parseInt(gender) == 1) {
                upi_gender = "female";
            } else if (parseInt(gender) == 2) {
                upi_gender = "male";
            }else
            {
                upi_gender = "unspecified";

            }

            //console.log(upi_gender);


            //Citizenship Code
            const country = await Country.findByPk(citizenship);
            if (!_.isEmpty(country))
            {
                upi_citizen=country.code;
            }else
            {
                upi_citizen='';


            }
            upi_citizen=citizenship;

            //County of Birth
            const county_birth_ = await County.findByPk(county_birth);
            if (!_.isEmpty(county_birth_))
            {
                upi_c_birth=county_birth_.code;
            }else
            {
                upi_c_birth='';


            }

          //  console.log(county_birth_);
            //County of Residence
            const county_residence = await County.findByPk(locator_county);
            if (!_.isEmpty(county_residence))
            {
                upi_c_residence=county_residence.code;
            }else
            {
                upi_c_residence='';

            }
            //Sub-County
            const scounty_residence = await SCounty.findByPk(locator_sub_county);
            if (!_.isEmpty(scounty_residence))
            {
                upi_sc_res=scounty_residence.value_upi;
            }else
            {
                upi_sc_res='';

            }
            //Ward
            const ward_residence = await Ward.findByPk(locator_ward);
            if (!_.isEmpty(ward_residence))
            {
                upi_ward_res=ward_residence.value_upi;
            }else
            {
                upi_ward_res='';
            }




            if (parseInt(marital) == 1) {
                upi_marital = "single";
            } else if ((parseInt(marital) == 2)|| (parseInt(marital) == 8)) {
                upi_marital = "married";

            }else if (parseInt(marital) == 3) {
                upi_marital = "divorced";
            
            } else if (parseInt(marital) == 4) {
                upi_marital = "widowed";
            }else
            {
                upi_marital = "unknown";
            }

            if (parseInt(sms_enable) == 1) {
                sms_enable = "Yes";
            } else if (parseInt(sms_enable) == 2) {
                sms_enable = "No";
            }
            upi_art=true;
            upi_ccc=upn;
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
            if(national_id !="-1")
            {
            identification_type='national-id';
            identification_value=national_id;
            }else
            {
            identification_type='birth-certificate';
            identification_value=birth_cert_no;
    
            }
    //console.log(upi_sc_res);
    //console.log(upi_ward_res);

    //res__.send(body);


        client_payload='{"clientNumber": "", "firstName": "'+f_name+'", "middleName": "'+m_name+'", "lastName": "'+l_name+'", "dateOfBirth": "'+dob+'",'
        +'"maritalStatus": "'+upi_marital+'", "gender": "'+upi_gender+'","occupation": "", "religion": "", "educationLevel": "","country": "'+upi_citizen+'", '
        +'"countyOfBirth": "'+upi_c_birth+'", "isAlive": true, "originFacilityKmflCode": "'+mfl_code+'", "isOnART":  '+upi_art+',  "nascopCCCNumber": "'+upi_ccc+'",'
        + '"residence": { "county": "'+upi_c_residence+'", "subCounty": "'+upi_sc_res.toLowerCase()+'","ward": "'+upi_ward_res.toLowerCase()+'", "village": "'+locator_village.toLowerCase()+'", "landMark": "", "address": "" },'
        +' "identifications": [ { "countryCode": "'+upi_citizen+'", "identificationType": "'+identification_type+'", "identificationNumber": "'+identification_value+'" }],'
        +'"contact": { "primaryPhone": "'+primary_phone_no+'", "secondaryPhone": "", "emailAddress": "" },'
        +' "nextOfKins": []}';

        //console.log(client_payload);

        //res__.send(JSON.parse(client_payload));

        var token_generated_='';
        var verified_data='';

        getAccessToken('url_invalid',function(token_generated){
            //Parse Token
            parsedBody= JSON.parse(token_generated);
            token_generated_=parsedBody.access_token;
        //Call Verification Endpoint
        

        const url_details = {
            url: error_update_url+upi_no+'/update',
            json: true,
            body: JSON.parse(client_payload),
            auth: {
            'bearer': token_generated_
            //'bearer': 'adsdasdsad'
        }
        }

        request.put(url_details, (err, res, body) => {
            if (err) {
            return console.log(err)
            }
        // console.log(res.body)

        //Log Response
            var log_upi_=Log_upi.create({ mfl_code: mfl_code, response: JSON.stringify(body), payload:client_payload});
            //log_upi_.save();

        if(res.statusCode==400)
        {
            res__.send(body);
        
        }else if (res.statusCode==200)
        {
            res__.send(body);

        }else if(res.statusCode==500)
        {

            res__.send(body);
        }else if(res.statusCode==401)
        {
            res__.send(body);

        }

        })

        });
  
});


//Search Record for the person
router.get('/search',  async (req, res) => {
    const upi_no = req.query.client_id;
    //Search Record
   // let client_details = await Client.findOne(client_id);
    let client_details = await Client.findOne({
               where: {
                    upi_no: upi_no
               }, 
           //    attributes: ["id","clinic_number", "f_name","m_name", "l_name","upi_no"],
           })
    if(client_details)
    {
        res.send({
            success: true,
            message: client_details
        });
        

    }else{

        res.send({ 
            success: false,
            message: 'No Record Found'
        });
       

    }
  

});


//Search Record for the person
router.get('/search_ccc',  async (req, res) => {
    const ccc_no = req.query.client_id;
    //Search Record
   // let client_details = await Client.findOne(client_id);
    let client_details = await Client.findOne({
               where: {
                clinic_number: ccc_no
               }, 
           //    attributes: ["id","clinic_number", "f_name","m_name", "l_name","upi_no"],
           })
    if(client_details)
    {
        res.send({
            success: true,
            message: client_details
        });
        

    }else{

        res.send({ 
            success: false,
            message: 'No Record Found'
        });
       

    }
  

});


module.exports = router;
