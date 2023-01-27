const express = require("express");
const router = express.Router();
const request = require('request');
const https = require('https');
const moment = require("moment");
const base64 = require("base64util");
require("dotenv").config();
//var mysql = require("mysql");
const mysql = require('mysql2');



//Fetch Client Details
router.get('/search', (req, res) => {
    const vCCC = req.query.ccc;
    const vmfl_code=req.query.mfl_code;

   // console.log(vTelephone)

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
         let todo = [vCCC, vmfl_code];
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


  });


  router.get('/applist', (req, res) => {
    const vFrom = req.query.start;
   // const vTo = req.query.end;
    const vTelephone=req.query.telephone;

    //console.log(vTelephone)

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
          
         let  sql = `CALL sp_appointmentcalendar_list(?,?)`;
         let todo = [vFrom, vTelephone];
          conn.query(sql,todo, (error, results, fields) => {
            if (error) {
                return console.error(error.message);
                conn.end();

              }
              //console.log(results[0]);

              res.send(results[0]);
         
           
            conn.end();
          });
    
       
   

    }catch(err){

    }


  });

  module.exports = router;