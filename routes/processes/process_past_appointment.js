const mysql = require('mysql2');
//const https = require('https');

const {
    PastAppointments
} = require("../../models/past_appointment");
const {Client} = require("../../models/client");
const {Clinic} = require("../../models/clinic");
const TracerClients = require("../../models/tracers_clients");
const express = require("express");
const router = express.Router();
const {
    User
} = require("../../models/user");
const base64 = require("base64util");
const { exitOnError } = require('winston');
const array = require('joi/lib/types/array');
require("dotenv").config();

function isEmpty(myvalue) {
    let isNull = true;
    if (myvalue == "" || myvalue == null || myvalue === null || myvalue == undefined) {

        isNull = true;
    } else {

        isNull = false;
    }

    return isNull;

}

router.post("/", async (req, res) => {
    let phone_no = req.body.phone_no;
    let user = await User.findOne({
        where: {
            phone_no: phone_no
        }
    });
    if (!user) res.status(400).send(`Phone Number: ${phone_no} is not registered in the system`);
    if (user.status != 'Active') res.status(400).send(`Phone Number: ${phone_no} is not active in the system`);

    let mfl = user.facility_id;
    let clinic = user.clinic_id;
    //console.log(clinic);
    var appointments=Array();

    //let appointments = await PastAppointments.findAll({
    //    where: {
     //       facility_id: mfl,
     //       clinic_id: clinic
     //   }
    //});
   // return res.status(200).send('asdsad');

   let tracer_client = await TracerClients.findAll({
    attributes: ['client_id'],
    where: {
        tracer_id: user.id
    }
});

    try{
    //Change Implementation to Consume Stored Procedure
    const conn = mysql.createPool({
        connectionLimit: 5,
        host: process.env.DB_SERVER,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        debug: true,
        multipleStatements: true,
      });
     //var appointments; 
     let sql = `CALL sp_getpastappointments(?,?)`;
     let todo = [mfl, clinic];


     

        conn.query(sql,todo, async (error, appointments, fields) =>  {

            if (error) {
                return res.status(400).send(`Error while fetching past appointments`);
               conn.end();
            }
            appointments=appointments[0];


            if (tracer_client.length) {
                let client_id = []
                tracer_client.forEach(x => client_id.push(x.client_id));
        
                if (!appointments) res.status(400).send(`You do not have any past appointments`);
        
                let message = new Array();
                for (let i = 0; i < appointments.length; i++) {
                    if (!client_id.includes(appointments[i].client_id)) {
                        console.log(appointments[i].client_id)
                        continue;
                    }
                    let facility_id = appointments[i].facility_id;
                    let user_phone_no = appointments[i].user_phone_no;
                    let mfl_code = appointments[i].facility_id;
                    let user_id = appointments[i].id;
                    let clinic_id = appointments[i].clinic_id;
                    let user_clinic = appointments[i].user_clinic;
                    let appointment_id = appointments[i].appointment_id;
                    let ccc = appointments[i].clinic_no;
                    let client_name = appointments[i].client_name;
                    let client_phone_no = appointments[i].client_phone_no;
                    let appointment_type = appointments[i].appointment_type;
                    let appointment_date = appointments[i].appntmnt_date;
                    let file_no = appointments[i].file_no;
                    let buddy_phone_no = appointments[i].buddy_phone_no;
                    let other_appointment_type = appointments[i].other_appointment_type;
                    let client_id=appointments[i].client_id;
                    //let hei_number = appointments[i].hei_number;
                    appointments[i].trmnt_buddy_phone_no = '';
                    if (isEmpty(buddy_phone_no)) {
                        appointments[i].trmnt_buddy_phone_no = '-1';
                    } else {
                        appointments[i].trmnt_buddy_phone_no = appointments[i].buddy_phone_no;
                    }
        
                    if (isEmpty(file_no)) {
                        file_no = '-1';
                    }
                    if (isEmpty(other_appointment_type)) {
                        other_appointment_type = '-1';
                    }
        
                    if (isEmpty(client_name)) {
                        appointments[i].client_name = '-1';
                    }
        
                    if (isEmpty(client_phone_no)) {
                        client_phone_no = '-1';
                    }
        
                    if (isEmpty(appointment_type)) {
                        appointment_type = '-1';
                    }
        
                    if (isEmpty(appointment_id)) {
                        appointment_id = '-1';
                    }
                    // if (isEmpty(hei_number)) {
                    //     hei_number = "-1";
                    // }
        
                    let outgoing_msg = ccc + "*" + client_name +
                        "*" + client_phone_no +
                        "*" + appointment_type +
                        "*" + appointment_id +
                        "*" + file_no +
                        "*" + appointments[i].trmnt_buddy_phone_no +
                        "*" + appointment_date +
                        "*" + client_id;
                    let encrypted_msg = "TOAPP*" + await base64.encode(outgoing_msg);
                    let innerMessage = {};
                    innerMessage.message = encrypted_msg;
                    message.push(innerMessage);
        
                }
        
        
                let result = {};
                result.result = message;
                res.status(200).send(result);
            } else {
        
                if (!appointments) res.status(400).send(`You do not have any past appointments`);
        
                let message = new Array();
                for (let i = 0; i < appointments.length; i++) {
                    let facility_id = appointments[i].facility_id;
                    let user_phone_no = appointments[i].user_phone_no;
                    let mfl_code = appointments[i].facility_id;
                    let user_id = appointments[i].id;
                    let clinic_id = appointments[i].clinic_id;
                    let user_clinic = appointments[i].user_clinic;
                    let appointment_id = appointments[i].appointment_id;
                    let ccc = appointments[i].clinic_no;
                    let client_name = appointments[i].client_name;
                    let client_phone_no = appointments[i].client_phone_no;
                    let appointment_type = appointments[i].appointment_type;
                    let appointment_date = appointments[i].appntmnt_date;
                    let file_no = appointments[i].file_no;
                    let buddy_phone_no = appointments[i].buddy_phone_no;
                    let other_appointment_type = appointments[i].other_appointment_type;
                    let client_id=appointments[i].client_id;

                    //let hei_number = appointments[i].hei_number;
                    appointments[i].trmnt_buddy_phone_no = '';
                    if (isEmpty(buddy_phone_no)) {
                        appointments[i].trmnt_buddy_phone_no = '-1';
                    } else {
                        appointments[i].trmnt_buddy_phone_no = appointments[i].buddy_phone_no;
                    }
        
                    if (isEmpty(file_no)) {
                        file_no = '-1';
                    }
                    if (isEmpty(other_appointment_type)) {
                        other_appointment_type = '-1';
                    }
        
                    if (isEmpty(client_name)) {
                        appointments[i].client_name = '-1';
                    }
        
                    if (isEmpty(client_phone_no)) {
                        client_phone_no = '-1';
                    }
        
                    if (isEmpty(appointment_type)) {
                        appointment_type = '-1';
                    }
        
                    if (isEmpty(appointment_id)) {
                        appointment_id = '-1';
                    }
                    // if (isEmpty(hei_number)) {
                    //     hei_number = "-1";
                    // }
        
                    let outgoing_msg = ccc + "*" + client_name +
                        "*" + client_phone_no +
                        "*" + appointment_type +
                        "*" + appointment_id +
                        "*" + file_no +
                        "*" + appointments[i].trmnt_buddy_phone_no +
                        "*" + appointment_date +
                        "*" + client_id;;
                    let encrypted_msg = "TOAPP*" + await base64.encode(outgoing_msg);
                    let innerMessage = {};
                    innerMessage.message = encrypted_msg;
                    message.push(innerMessage);
        
                }
        
        
                let result = {};
                result.result = message;
                res.status(200).send(result);
            }
        
           
       
        conn.end();
        });
    //console.log(appointments);

    }catch(err){
        return res.status(400).send(`Error while fetching past appointments`);
    
    }

   
   // console.log(tracer_client);
   // process.exit();
    
});

router.post("/new", async (req, res) => {
    let phone_no = req.body.phone_no;

    let user = await User.findOne({
        where: {
            phone_no: phone_no
        }
    });
    if (!user) res.status(400).send(`Phone Number: ${phone_no} is not registered in the system`);
    if (user.status != 'Active') res.status(400).send(`Phone Number: ${phone_no} is not active in the system`);

    let mfl = user.facility_id;
    let clinic = user.clinic_id;

    let appointments = await PastAppointments.findAll({
        where: {
            facility_id: mfl,
            clinic_id: clinic
        }
    });
    let tracer_client = await TracerClients.findAll({
        attributes: ['client_id'],
        where: {
            tracer_id: user.id
        }
    })
    let client_id = []
    tracer_client.forEach(x => client_id.push(x.client_id));

    if (!appointments || !tracer_client) res.status(400).send(`You do not have any past appointments`);

    let message = new Array();
    for (let i = 0; i < appointments.length; i++) {
        if (!client_id.includes(appointments[i].client_id)) {
            console.log(appointments[i].client_id)
            continue;
        }
        let facility_id = appointments[i].facility_id;
        let user_phone_no = appointments[i].user_phone_no;
        let mfl_code = appointments[i].facility_id;
        let user_id = appointments[i].id;
        let clinic_id = appointments[i].clinic_id;
        let user_clinic = appointments[i].user_clinic;
        let appointment_id = appointments[i].appointment_id;
        let ccc = appointments[i].clinic_no;
        let client_name = appointments[i].client_name;
        let client_phone_no = appointments[i].client_phone_no;
        let appointment_type = appointments[i].appointment_type;
        let appointment_date = appointments[i].appntmnt_date;
        let file_no = appointments[i].file_no;
        let buddy_phone_no = appointments[i].buddy_phone_no;
        let other_appointment_type = appointments[i].other_appointment_type;
        let client_id=appointments[i].client_id;
        
        //let hei_number = appointments[i].hei_number;
        appointments[i].trmnt_buddy_phone_no = '';
        if (isEmpty(buddy_phone_no)) {
            appointments[i].trmnt_buddy_phone_no = '-1';
        } else {
            appointments[i].trmnt_buddy_phone_no = appointments[i].buddy_phone_no;
        }

        if (isEmpty(file_no)) {
            file_no = '-1';
        }
        if (isEmpty(other_appointment_type)) {
            other_appointment_type = '-1';
        }

        if (isEmpty(client_name)) {
            appointments[i].client_name = '-1';
        }

        if (isEmpty(client_phone_no)) {
            client_phone_no = '-1';
        }

        if (isEmpty(appointment_type)) {
            appointment_type = '-1';
        }

        if (isEmpty(appointment_id)) {
            appointment_id = '-1';
        }
        // if (isEmpty(hei_number)) {
        //     hei_number = "-1";
        // }

        let outgoing_msg = ccc + "*" + client_name +
            "*" + client_phone_no +
            "*" + appointment_type +
            "*" + appointment_id +
            "*" + file_no +
            "*" + appointments[i].trmnt_buddy_phone_no +
            "*" + appointment_date +
            "*" + client_id;
        let encrypted_msg = "TOAPP*" + await base64.encode(outgoing_msg);
        let innerMessage = {};
        innerMessage.message = encrypted_msg;
        message.push(innerMessage);

    }


    let result = {};
    result.result = message;
    res.status(200).send(result);


});

router.post("/assign", async (req, res) => {

    let clinics = await Clinic.findAll();
    let tracers = await User.findAll({
        where: {
            role_id: 12,
            partner_id: req.body.partner_id
        }
    })
    let mfl_codes = [];
    let clinic = [];
    if (tracers.length && clinics.length) {
        let i;
        for (i = 0; i < tracers.length; i++) {
            mfl_codes.push(tracers[i].facility_id)
        }
        mfl_codes = mfl_codes.filter((v, i, a) => a.indexOf(v) === i);

        for (i = 0; i < clinics.length; i++) {
            clinic.push(clinics[i].id)
        }

        for (i = 0; i < clinic.length; i++)
            for (let k = 0; k < mfl_codes.length; k++) {
                let clients = await Client.findAll({
                    where: {
                        mfl_code: mfl_codes[k],
                        clinic_id: clinic[i],
                        partner_id: req.body.partner_id
                    }
                });
                let tracerCount = await User.findAll({
                    where: {
                        role_id: 12,
                        facility_id: mfl_codes[k],
                        clinic_id: clinic[i],
                        partner_id: req.body.partner_id
                    }
                })
                if (!tracerCount.length)
                    continue;
                var result = chunkArray(clients, tracerCount.length);
                console.log(result.length, tracerCount.length)

                for (let j = 0; j < result.length; j++)
                    for (let l = 0; l < result[j].length; l++) {
                        await TracerClients.create({
                            tracer_id: tracerCount[j].id,
                            client_id: result[j][l].id
                        });
                    }
            }

        res.json({
            message: `Tracers attached for partner ${req.body.partner_id}`
        })

    } else {
        res.json({
            message: "No tracers found"
        })
    }
});

function chunkArray(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
}

module.exports = router;