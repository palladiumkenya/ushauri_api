const {
    Client
} = require("../../models/client");
const {
    Transit
} = require("../../models/transit");
const moment = require("moment");
const base64 = require("base64util");

async function transitClient(message, user) {
    message = message.split("*");
    message = message[1];

    message = message.split("#");
    let decoded_message = await base64.decode(message[0]);

    //check validity of base 64 encode
    if (!(base64.encode(decoded_message).trim() === message[0].trim()))
        return {
            code: 400,
            message: "Your application needs to be updated to use this feature"
        };
    const variables = decoded_message.split("*");
    const ccc_number = variables[0];
    const appointment_type = variables[1];
    const id_number = variables[2];
    const no_of_drugs = variables[3];
    const duration = variables[4];

    if (parseInt(appointment_type) != 1)
        return {
            code: 400,
            message: "Transit Client module is only applicable for Re-Fills"
        };

    let today = moment(new Date()).format("YYYY-MM-DD");
    let client = await Client.findOne({
        where: {
            clinic_number: ccc_number
        }
    });
    if (!client) client.id = "";
    return Transit.create({
            ccc_number: ccc_number,
            transit_facility: user.facility_id,
            client_id: client.id,
            appointment_type_id: appointment_type,
            client_id_number: id_number,
            no_of_drugs: no_of_drugs,
            drugs_duration: duration,
            ccc_number: ccc_number,
            created_by: user.id
        })
        .then(new_app => {
            return {
                code: 200,
                message: `Transit Encounter for ${ccc_number} was created successfully`
            };
        })
        .catch(e => {
            return {
                code: 500,
                message: e.message
            };
        });
}

module.exports = transitClient;