const {
    Client
} = require("../../models/client");
const {
    User
} = require("../../models/user");
const TracerClients = require("../../models/tracers_clients");
const {
    Appointment
} = require("../../models/appointment");
const moment = require("moment");
const base64 = require("base64util");
const {
    Sender
} = require("../../models/africastalking");
const {
    Message
} = require("../../models/message");
const {
    date
} = require("joi");

async function registerClient(message, user) {
    message = message.split("*");
    message = message[1];

    message = message.split("#");

    let decoded_message = await base64.decode(message[0].trim());

    decoded_message = "Reg*" + decoded_message;


    const variables = decoded_message.split("*");
    console.log(variables.length);
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


    const mfl_code = user.facility_id;
    const clinic_id = user.clinic_id;
    const partner_id = user.partner_id;
    const user_id = user.id;



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
    console.log(diffDays)
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
    } else if (parseInt(condition) == 2) {
        condition = "Pre-Art";
        art_start_date = null;
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




    if (transaction_type == 1 || transaction_type == 3) {
        //New Registration or Transfer IN for a client not existing in the system

        const client = await Client.findOne({
            where: {
                clinic_number: upn
            }
        });
        if (client)
            return {
                code: 400,
                message: `Client: ${upn} already exists in the system`
            };

        let consented = moment(new Date()).format("YYYY-MM-DD");
        if (parseInt(sms_enable) == 1) {
            sms_enable = "Yes";
        } else if (parseInt(sms_enable) == 2 || sms_enable === "-1") {
            sms_enable = "No";
            consented = null;
        }

        let motivational_enable;
        if (parseInt(motivation_enable) == 1) {
            motivational_enable = "Yes";
        } else if (parseInt(motivation_enable) == 2 || motivation_enable === "-1") {
            motivational_enable = "No";
        }
        let welcome_sent;
        if (sms_enable == "Yes" && language != 5) {
            welcome_sent = "Yes";
        } else if (language == 5 && sms_enable == "No") {
            welcome_sent = "No";
        }
        if (language < 0) {
            language = 5;
        }




        //save the client details
        return Client.findOrCreate({
            where: {
                clinic_number: upn
            },
            defaults: {
                mfl_code: mfl_code,
                f_name: f_name,
                m_name: m_name,
                l_name: l_name,
                dob: dob,
                gender: gender,
                marital: marital,
                client_status: condition,
                enrollment_date: enrollment_date,
                group_id: group_id,
                phone_no: primary_phone_no,
                alt_phone_no: alt_phone_no,
                buddy_phone_no: trtmnt_buddy_phone_no,
                language_id: language,
                smsenable: sms_enable,
                consent_date: consented,
                partner_id: partner_id,
                status: status,
                art_date: art_start_date,
                created_at: b,
                entry_point: "Mobile",
                welcome_sent: welcome_sent,
                created_by: user_id,
                client_type: client_type,
                txt_time: messaging_time,
                motivational_enable: motivational_enable,
                wellness_enable: motivational_enable,
                national_id: national_id,
                upi_no: upi_no,
                birth_cert_no:birth_cert_no,
                file_no: serial_no,
                clnd_dob: dob,
                clinic_id: clinic_id,
                locator_county: locator_county,
                locator_sub_county: locator_sub_county,
                locator_ward: locator_ward,
                locator_village: locator_village,
                locator_location: locator_location
            }

        })

        .then(async([client, created]) => {
                if (created) {

                    if (sms_enable == "Yes" && language != 5) {
                        let message = await Message.findAll({
                            where: {
                                message_type_id: 3,
                                language_id: language
                            }
                        });


                        //here we loop through an object
                        var new_message;
                        Object.values(message).forEach(value => {
                            let phone;
                            new_message = value.message;

                            if (value.logic_flow == 1) {
                                new_message = new_message.replace("XXX", f_name);
                            }
                            if (value.logic_flow == 2) {
                                new_message;
                            }


                            if (primary_phone_no != null) {
                                phone = primary_phone_no;
                            } else if (primary_phone_no == null && alt_phone_no != null) {
                                phone = alt_phone_no;
                            } else if (
                                primary_phone_no == null &&
                                alt_phone_no == null &&
                                buddy_phone_no != null
                            ) {
                                phone = buddy_phone_no;
                            }
                            Sender(phone, new_message);


                        });

                    }

                    return {
                        code: 200,
                        message: `Client ${upn} was created successfully`
                    };
                } else {
                    return {
                        code: 400,
                        message: `Error. Client ${upn} could not be created`
                    };
                }
            })
            .catch(e => {
                return {
                    code: 500,
                    message: e.message
                };
            });

    } else if (transaction_type == 2) {
        let update_array = {
            f_name: f_name,
            m_name: m_name,
            l_name: l_name,
            dob: dob,
            gender: gender,
            marital: marital,
            client_status: condition,
            enrollment_date: enrollment_date,
            phone_no: primary_phone_no,
            alt_phone_no: alt_phone_no,
            buddy_phone_no: trtmnt_buddy_phone_no,
            language_id: language,
            smsenable: sms_enable,
            partner_id: partner_id,
            status: status,
            art_date: art_start_date,
            updated_by: user_id,
            updated_at: b,
            txt_time: messaging_time,
            motivational_enable: motivational_enable,
            wellness_enable: motivational_enable,
            national_id: national_id,
            upi_no: upi_no,
            birth_cert_no:birth_cert_no,
            file_no: serial_no,
            locator_county: locator_county,
            locator_sub_county: locator_sub_county,
            locator_ward: locator_ward,
            locator_village: locator_village,
            locator_location: locator_location
        };

        let clean_object = await cleanUpdateObject(update_array);

        //save the client details
        let client_check = await Client.findOne({
            where: {
                clinic_number: upn
            }
        });
        if (clean_object.dob) {
            if (moment(clean_object.dob).format('YYYY-MM-DD') > moment(client_check.enrollment_date).format('YYYY-MM-DD')) {
                return {
                    code: 400,
                    message: "Date of Birth cannot be greater than enrollment date"
                };

            }
        }
        if (clean_object.enrollment_date) {
            if (moment(client_check.dob).format('YYYY-MM-DD') > moment(clean_object.enrollment_date).format('YYYY-MM-DD')) {
                return {
                    code: 400,
                    message: "Date of Birth cannot be greater than enrollment date"
                };

            }
        }
        return Client.update(clean_object, {
                where: {
                    clinic_number: upn
                }
            })
            .then(async([updated, client]) => {

                client = await Client.findOne({
                    where: {
                        clinic_number: upn
                    }
                });
                if (updated) {
                    if (language < 0 || language === '' || language == null) {
                        language = 5
                    }
                    if (status) {
                        if (status != "Active") {
                            let get_active_app = await Appointment.findAll({
                                where: {
                                    client_id: client.id,
                                    active_app: '1'
                                }
                            })
                            for (let app of get_active_app) {
                                Appointment.update({
                                        active_app: "0",
                                        updated_at: today,
                                        updated_by: user.id
                                    }, {
                                        returning: true,
                                        where: {
                                            id: app.id
                                        }
                                    })
                                    .then(() => {})
                                    .catch(e => {
                                        console.log(e.message)
                                    });

                            }
                        }
                    }

                    return {
                        code: 200,
                        message: `Client ${upn} was updated successfully`
                    };
                } else {
                    return {
                        code: 400,
                        message: `Could not update client ${upn}`
                    };
                }
            })
            .catch(e => {
                return {
                    code: 500,
                    message: e.message
                };
            });
    } else {
        return {
            code: 400,
            message: "Not a valid transaction type"
        };
    }
}

function cleanUpdateObject(obj) {
    let new_key_array = new Array();

    const value_array = Object.values(obj);
    const key_array = Object.keys(obj);
    for (let i = 0; i < value_array.length; i++) {
        if (value_array[i] == "-1") {
            new_key_array.push(key_array[i]);
        }
    }

    for (let j = 0; j < new_key_array.length; j++) {
        delete obj[new_key_array[j]];
    }
    //console.log(value_array)
    return obj;

}


module.exports = registerClient;