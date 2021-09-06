const {
    Client
} = require("../../models/client");
const moment = require("moment");
const base64 = require("base64util");
async function consentClient(message, user) {
    message = message.split("*");
    message = message[1];

    message = message.split("#");
    let decoded_message = await base64.decode(message[0]);

    // check if it is a valid base 64 encode
    if (!(base64.encode(decoded_message).trim() === message[0].trim()))
        return {
            code: 400,
            message: "Your application needs to be updated to use this feature"
        };

    decoded_message = "CON*" + decoded_message;
    const variables = decoded_message.split("*");

    const message_code = variables[0];
    const ccc_number = variables[1];
    const consent_date = variables[2];
    let preferred_time = variables[3];
    const client_phone_no = variables[4];
    preferred_time = preferred_time.substring(0, 2);
    let consented = moment(consent_date, "DD/MM/YYYY").format("YYYY-MM-DD");
    let today = moment(new Date()).format("YYYY-MM-DD");
    let client = await Client.findOne({
        where: {
            clinic_number: ccc_number
        }
    });
    if (!client)
        return {
            code: 400,
            message: `Client: ${ccc_number} does not exist in the system. Please register them first.`
        };
    if (client.status != "Active")
        return {
            code: 400,
            message: `Client: ${ccc_number} is not active in the system.`
        };
    if (client.smsenable == "Yes")
        return {
            code: 400,
            message: `Client: ${ccc_number} is already consented in the system.`
        };

    return Client.update({
            smsenable: "Yes",
            consent_date: consented,
            phone_no: client_phone_no,
            updated_by: user.id,
            txt_time: preferred_time,
            updated_at: today
        }, {
            where: {
                clinic_number: ccc_number
            }
        })
        .then(([client, updated]) => {
            return {
                code: 200,
                message: `Client ${ccc_number} was successfully consented in the system`
            };
        })
        .catch(e => {
            return {
                code: 500,
                message: `Could not consent client ${ccc_number} `
            };
        });
}
module.exports = consentClient;