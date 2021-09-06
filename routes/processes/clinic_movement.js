{
  const { Client } = require("../../models/client");
  const { Clinic } = require("../../models/clinic");
  const { User } = require("../../models/user");

  const moment = require("moment");
  const base64 = require("base64util");

  async function moveClient(message, user) {
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
    const clinic_id = variables[1];
    let clinic = await Clinic.findByPk(clinic_id);
    let today = moment(new Date()).format("YYYY-MM-DD");
    let client = await Client.findOne({ where: { clinic_number: ccc_number } });

    if (!clinic)
      return {
        code: 400,
        message: `Clinic: ${clinic_id} does not exist in the system.`
      };
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
    if (client.clinic_id == clinic_id)
      return {
        code: 400,
        message: `Client: ${ccc_number} already exists in the  Clinic : ${clinic.name} and cannot be moved . `
      };

    let active_clinic = await User.findAll({
      where: { facility_id: user.facility_id, clinic_id: clinic.id }
    });
    if (active_clinic.length === 0) {
      return {
        code: 200,
        message: `Clinic: ${clinic.name} has not been activated in your facility`
      };
    }

    return Client.update(
      {
        clinic_id: clinic.id,
        updated_by: user.id,
        updated_at: today
      },
      { where: { clinic_number: ccc_number } }
    )
      .then(([client, updated]) => {
        return {
          code: 200,
          message: `Client ${ccc_number} was successfully moved to new Clinic: ${clinic.name} `
        };
      })
      .catch(e => {
        return {
          code: 500,
          message: `Could not move client ${ccc_number} to the new clinic.`
        };
      });
  }
  module.exports = moveClient;
}
