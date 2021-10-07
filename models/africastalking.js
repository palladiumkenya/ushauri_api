require("dotenv").config();

const config = {
    apiKey: process.env.API_KEY,
    username: process.env.API_USERNAME
};
const AfricasTalking = require("africastalking")(config);
const sms = AfricasTalking.SMS;

function sendSMS(number, msg) {
    let num;
    if (number.includes("+254")) {
        num = number;
    } else {
        num = number.substr(1);
        num = "+254" + num;
    }
    const options = {
        from: "40149",
        to: num,
        message: msg
    };
    return sms
        .send(options)
        .then(response => {
            return response;
        })
        .catch(error => {
            return error.toString();
        });
}

exports.Sender = sendSMS;
