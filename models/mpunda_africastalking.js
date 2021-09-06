const config = {
  apiKey: "9318d173cb9841f09c73bdd117b3c7ce3e6d1fd559d3ca5f547ff2608b6f3212",
  username: "mhealthkenya"
};
const AfricasTalking = require("africastalking")(config);
const sms = AfricasTalking.SMS;

function sendSMS(from, number, msg) {
  let num;
  if (number.includes("+254")) {
    num = number;
  } else {
    num = number.substr(1);
    num = "+254" + num;
  }
  const options = {
    from: from,
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
