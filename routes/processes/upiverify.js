const { User } = require("../../models/user");
const express = require("express");
const router = express.Router();
const request = require('request');
//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const https = require('https');
require("dotenv").config();


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
module.exports = router;
