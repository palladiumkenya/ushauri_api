const express = require("express");
const router = express.Router();
//const sequelize = require("../../db_config");

const request = require("request");
const https = require("https");
const moment = require("moment");
const base64 = require("base64util");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
const { Buffer } = require("buffer");
const axios = require("axios");

const admin = require("firebase-admin");
const cron = require("node-cron");

const users = [];

module.exports = { router, users };
require("dotenv").config();
//const Op = require("sequelize");
const { Op, fn, col, literal, QueryTypes } = require("sequelize");
var bcrypt = require("bcrypt");
const crypto = require("crypto");

// const sequelize = require("sequelize");

//const Sequelize = require('sequelize');

require("dotenv").config();
//var mysql = require("mysql");
const mysql = require("mysql2");
const { NUsers } = require("../../models/n_users");
const { NUserprograms } = require("../../models/n_user_programs");
const mysql_promise = require("mysql2/promise");

const { Client } = require("../../models/client");
const { Napptreschedule } = require("../../models/n_appoint_reschedule");

const { NLogs } = require("../../models/n_logs");
const { parse } = require("path");
const { NprogramTypes } = require("../../models/n_program_type");
const { NUserProfile } = require("../../models/n_user_profile");
const { decode } = require("punycode");
const { Appointment } = require("../../models/appointment");
const { NDrugOrder } = require("../../models/n_drug_order");
const { NDrugDelivery } = require("../../models/n_drug_delivery");
const { NCourier } = require("../../models/n_courier");
const { masterFacility } = require("../../models/master_facility");
const { NBmi } = require("../../models/n_bmi");
const { NpatientObs } = require("../../models/n_patient_obs");
const { NReviews } = require("../../models/n_reviews");
const { NprogramOTP } = require("../../models/n_program_otp");
const { NToken } = require("../../models/n_revoke_token");

const { NChatLogs } = require("../../models/n_chat_log");
const { NFAQ } = require("../../models/n_faq");
const { NBmiLog } = require("../../models/n_bmi_log");
const { NBloodPressure } = require("../../models/n_blood_pressure");
const { NBloodSugar } = require("../../models/n_blood_sugar");
const { NMenstrual } = require("../../models/n_menstrual");
const { Nroles } = require("../../models/n_roles");

generateOtp = function (size) {
	const zeros = "0".repeat(size - 1);
	const x = parseFloat("1" + zeros);
	const y = parseFloat("9" + zeros);
	const confirmationCode = String(Math.floor(x + Math.random() * y));
	return confirmationCode;
};


router.post("/patient", async (req, res) => {
    try {
        // Extract patient resource from request body
        const patientResource = req.body;
    
        // Function to process patient data
        function processPatientData(patient) {
          const name = patient.name[0]?.text || "Unknown";
          const gender = patient.gender || "Unknown";
          const birthDate = patient.birthDate || "Unknown";
          const isActive = patient.active ? "Active" : "Inactive";
    
          const identifiers = patient.identifier.map((id) => ({
            type: id.type.text,
            value: id.value,
            location: id.extension[0]?.valueReference?.display || "Unknown"
          }));
    
          const addresses = patient.address.map((addr) => ({
            use: addr.use,
            city: addr.city,
            district: addr.district,
            state: addr.state
          }));
    
          return { name, gender, birthDate, isActive, identifiers, addresses };
        }
    
        // Process the patient resource
        const processedData = processPatientData(patientResource);
        res.status(200).json({ message: "Patient data processed successfully", processedData });
      } catch (error) {
        console.error("Error processing patient data:", error.message);
        res.status(500).json({ error: "Failed to process patient data" });
      }
    });
module.exports = router;
//module.exports = { router, users };
