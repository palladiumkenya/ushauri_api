const {
    User
} = require("../models/user");
const {
    Incoming
} = require("../models/incoming");
const {
    Sender
} = require("../models/africastalking");
const {
    Outgoing
} = require("../models/outgoing")
const express = require("express");
const base64 = require("base64util");
const {
    TodayAppointments
} = require("../models/todays_appointment");
const router = express.Router();
const registerClient = require("./processes/registration");
const consentClient = require("./processes/consent");
const processAppointment = require("./processes/process_appointment");
const clearFakeMissed = require("./processes/clear_fake_missed");
const processDefaulterDiary = require("./processes/process_defaulter_diary");
const moveClient = require("./processes/clinic_movement");
const transferClient = require("./processes/transer_client");
const transitClient = require("./processes/transit_client");
const getTodaysAppoitnmentSMS = require("./processes/get_todays_appointments_sms");
const getPastAppoitnmentSMS = require("./processes/get_past_appointments_sms");

router.post("/", async(req, res) => {
    let message = req.body.msg;
    const phone = req.body.phone_no;
    //check if user exists

    let user = await User.findOne({
        where: {
            phone_no: phone
        }
    });
    if (!user)
        res
        .status(400)
        .send(`Phone Number: ${phone} is not registered in the system`);

    //check if message if registration message

    if (message.includes("Reg")) {
        let result = await registerClient(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (message.includes("CON")) {
        let result = await consentClient(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (message.includes("APP")) {
        let result = await processAppointment(message, user);
        message = message.split("*");
        message = message[1];
        message = message.split("#");
        let decoded_message = await base64.decode(message[0]);
        decoded_message = "APP*" + decoded_message;

        const variables = decoded_message.split("*");

        const upn = variables[1];
	console.log(result)
        if (result.code === 200) {
            await TodayAppointments.destroy({
                where: {
                    clinic_no: upn
                }
            })
        }
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (message.includes("FAKE")) {
        let result = await clearFakeMissed(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (message.includes("TRANSITCLIENT")) {
        let result = await transitClient(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (message.includes("MOVECLINIC")) {
        let result = await moveClient(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (message.includes("TRANS")) {
        let result = await transferClient(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    } else if (
        message.includes("MSD") ||
        message.includes("DF") ||
        message.includes("LTFU")
    ) {
        let result = await processDefaulterDiary(message, user);
        res.status(`${result.code}`).send(`${result.message}`);
    }
});

router.get("/:id", async(req, res) => {
    const incoming_id = req.params.id;

    let incoming = await Incoming.findByPk(incoming_id);

    if (!incoming)
        res.status(400).send(`Incoming ID: ${incoming_id} not in the system`);

    if (incoming.processed == "Not Processed") {
        let message = incoming.msg;
        message = message.split("#");
        let phone = incoming.source;
        if (phone.length == 10) {
            phone = phone.substring(1);
            phone = "0" + phone;
        } else {
            phone = phone.substring(4);
            phone = "0" + phone;
        }
        console.log(phone);
        message = message[0];

        let user = await User.findOne({
            where: {
                phone_no: phone
            }
        });
        if (!user) {
            msg = `Phone Number: ${phone} is not registered in the system`;
            let sender = await Sender(phone, msg);
            res.send(sender);
        } else {
            if (message.includes("Reg")) {
                let result = await registerClient(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            } else if (message.includes("CON")) {
                let result = await consentClient(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            } else if (message.includes("TRANS")) {
                let result = await transferClient(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            } else if (message.includes("APP")) {
                let result = await processAppointment(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            } else if (message.includes("MOVECLINIC")) {
                let result = await moveClient(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            } else if (
                message.includes("MSD") ||
                message.includes("DF") ||
                message.includes("LTFU")
            ) {
                let result = await processDefaulterDiary(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            } else if (message.includes("TRANSITCLIENT")) {
                let result = await transitClient(message, user);
                Sender(phone, `${result.message}`);
                await Outgoing.create({
                    destination: phone,
                    source: '40146',
                    msg: result.message,
                    status: 'Not Sent',
                    message_type_id: '5',
                    clnt_usr_id: user.id,
                    recepient_type: 'User',
                    outgoing_id: incoming_id
                }).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message
                    })
                })
            }
        }
        Incoming.update({
                processed: "Processed"
            }, {
                returning: true,
                where: {
                    id: incoming_id
                }
            })
            .then(([client, updated]) => {
                if (updated) {
                    Outgoing.update({
                        status: 'Sent'
                    }, {
                        returning: true,
                        where: {
                            outgoing_id: incoming_id
                        }
                    }).then(([user, updated]) => {

                    }).catch(e => {})
                }
            })
            .catch(e => {});
    }
    res.send(true);
});

module.exports = router;
