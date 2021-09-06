const { TodayAppointments } = require("../../models/todays_appointment");
const base64 = require("base64util");
const { User } = require("../../models/user");

module.exports = async function getTodaysAppointment(phone_no) {
  let user = await User.findOne({ where: { phone_no: phone_no } });
  if (!user) return `Phone Number: ${phone_no} is not registered in the system`;

  if (user.status != "Active")
    return `Phone Number: ${phone_no} is not active in the system`;

  let mfl = user.facility_id;
  let clinic = user.clinic_id;

  let appointments = await TodayAppointments.findAll({
    where: {
      mfl_code: mfl,
      clinic_id: clinic
    }
  });

  if (appointments === undefined || appointments.length == 0)
    return `You do not have any appointments today`;

  let message = new Array();
  for (let i = 0; i < appointments.length; i++) {
    let facility_id = appointments[i].facility_id;
    let user_phone_no = appointments[i].user_phone_no;
    let mfl_code = appointments[i].facility_id;
    let user_id = appointments[i].id;
    let clinic_id = appointments[i].clinic_id;
    let appointment_id = appointments[i].appointment_id;
    let CCC = appointments[i].clinic_no;
    let client_name = appointments[i].client_name;
    let client_phone_no = appointments[i].client_phone_no;
    let appointment_type = appointments[i].appointment_type;
    let appointment_date = appointments[i].appntmnt_date;
    let file_no = appointments[i].file_no;
    let buddy_phone_no = appointments[i].buddy_phone_no;
    appointments[i].trmnt_buddy_phone_no = "";
    if (isEmpty(buddy_phone_no)) {
      appointments[i].trmnt_buddy_phone_no = "-1";
    } else {
      appointments[i].trmnt_buddy_phone_no = appointments[i].buddy_phone_no;
    }

    if (isEmpty(file_no)) {
      file_no = "-1";
    }

    if (isEmpty(client_name)) {
      appointments[i].client_name = "-1";
    }

    if (isEmpty(client_phone_no)) {
      client_phone_no = "-1";
    }

    if (isEmpty(appointment_type)) {
      appointment_type = "-1";
    }

    if (isEmpty(appointment_id)) {
      appointment_id = "-1";
    }

    let outgoing_msg =
      CCC +
      "*" +
      client_name +
      "*" +
      client_phone_no +
      "*" +
      appointment_type +
      "*" +
      appointment_id +
      "*" +
      file_no +
      "*" +
      appointments[i].trmnt_buddy_phone_no +
      "*" +
      appointment_date;
    let encrypted_msg = "TOAPP*" + (await base64.encode(outgoing_msg));

    message.push(encrypted_msg);
  }
  return message;
};

function isEmpty(myvalue) {
  let isNull = true;
  if (
    myvalue == "" ||
    myvalue == null ||
    myvalue === null ||
    myvalue == undefined
  ) {
    isNull = true;
  } else {
    isNull = false;
  }

  return isNull;
}
