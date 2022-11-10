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
    Country
} = require("../../models/countries");

const express = require("express");
const router = express.Router();
const request = require('request');
//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
const https = require('https');


const moment = require("moment");
const base64 = require("base64util");


  //Countries
  router.get('/countries', async (req, res)=> {
    
  
    let countries = await Country.findAll();
  
    if (!countries)
      res
        .status(400)
        .send(`Countries List Not Found`);
   // let result = {};
   // result.result = [{ code: counties.code,name: counties.name }];
  res.status(200).send(countries);
  });


  //Counties
router.get('/counties', async (req, res)=> {
    
  
    let counties = await County.findAll();
  
    if (!counties)
      res
        .status(400)
        .send(`Counties List Not Found`);
   // let result = {};
   // result.result = [{ code: counties.code,name: counties.name }];
  res.status(200).send(counties);
  });

  //SubCounties
  router.get('/scounties', async (req, res)=> {
    
  
    const countyid = req.query.county; 
        //console.log(countyid);
    //console(county_id);
    let scounties = await SCounty.findAll({ where: { county_id: countyid }});
  
    if (!scounties)
      res
        .status(400)
        .send(`Sub County Not Found`);
   // let result = {};
   // result.result = [{ code: counties.code,name: counties.name }];
  res.status(200).send(scounties);
  });



  //Wards
  router.get('/wards', async (req, res)=> {
    
  
    const scountyid = req.query.scounty; 
        //console.log(countyid);
    //console(county_id);
    let wards = await Ward.findAll({ where: { scounty_id: scountyid }});
  
    if (!wards)
      res
        .status(400)
        .send(`Wards Not Found`);
   // let result = {};
   // result.result = [{ code: counties.code,name: counties.name }];
  res.status(200).send(wards);
  });
  module.exports = router;
