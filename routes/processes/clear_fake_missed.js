const { Client } = require("../../models/client");
const moment = require("moment");
const base64 = require("base64util");
const { Appointment } = require("../../models/appointment");
const { clientOutcome } = require("../../models/client_outcome");
const {
  OtherAppointmentType
} = require("../../models/other_appointment_types");

async function clearFakeAppointment(message, user) {
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

  decoded_message = "FAKE*" + decoded_message;
  const variables = decoded_message.split("*");

  if (variables.length != 6)
    return {
      code: 400,
      message: "Your application needs to be updated to use this feature"
    };

  const fake = variables[0];
  let new_actual_date_attended = variables[1];
  let new_next_tca = variables[2];
  let new_appointment_type = variables[3];
  const old_appointment_id = variables[4];
  let appointment_other = variables[5];
  let today = moment(new Date());
  let next_tca = moment(new_next_tca, "DD/MM/YYYY").format("YYYY-MM-DD");
  let actual_date_attended = moment(
    new_actual_date_attended,
    "DD/MM/YYYY"
  ).format("YYYY-MM-DD");

  if (old_appointment_id == "-1") {
    return {
      code: 400,
      message: "No appointment ID for the fake missed appointment was provided"
    };
  }
  if (moment(next_tca).isSameOrBefore(today)) {
    return {
      code: 400,
      message: "New appointment date has to be greater than current date"
    };
  }
  let fake_missed_appointment = await Appointment.findByPk(old_appointment_id);
  if (!fake_missed_appointment)
    return {
      code: 404,
      message: "Appointment to be updated was not found"
    };

  let client = await Client.findByPk(fake_missed_appointment.client_id);
  if (!client)
    return {
      code: 400,
      message: "Client attached to the selected appointment does not exist"
    };
  if (
    moment(fake_missed_appointment.appntmnt_date).isBefore(today) &&
    fake_missed_appointment.active_app == 1 &&
    fake_missed_appointment.appointment_kept == null
  ) {
    let outcome = await clientOutcome.findOne({
      where: { appointment_id: fake_missed_appointment.id }
    });
    if (outcome)
      return {
        code: 400,
        message: `The client:  ${
          client.clinic_number
        }, was already traced and can not be cleared as a fake missed appointment.`
      };
    if (moment(actual_date_attended).isAfter(today))
      return {
        code: 400,
        message: "Date attended cannot be greater than today"
      };

    if (
      moment(fake_missed_appointment.appntmnt_date).isAfter(
        actual_date_attended
      )
    ) {
      return Appointment.update(
        {
          appointment_kept: "Yes",
          date_attended: actual_date_attended,
          unscheduled_date: actual_date_attended,
          active_app: "0",
          updated_at: today,
          updated_by: user.id,
          app_status: "Notified",
          visit_type: "Un-Scheduled"
        },
        { where: { id: old_appointment_id } }
      )
        .then(async ([updated, old_app]) => {
          if (updated) {
            //create new appointment

            let create_appointment = await Appointment.create({
              app_status: "Booked",
              appntmnt_date: next_tca,
              status: "Active",
              sent_status: "Sent",
              client_id: client.id,
              created_at: today,
              created_by: user.id,
              app_type_1: new_appointment_type,
              entry_point: "Mobile",
              visit_type: "Scheduled",
              active_app: "1"
            }).then(new_app => {
              if (new_appointment_type == "6") {
                return OtherAppointmentType.create({
                  name: appointment_other,
                  created_by: user.id,
                  created_at: today,
                  appointment_id: new_app.id
                })
                  .then(other_app => {
                    return {
                      code: 200,
                      message: `Appointment for ${
                        Client.clinic_number
                      } on ${next_tca} was created successfully`
                    };
                  })
                  .catch(e => {
                    return {
                      code: 200,
                      message:
                        "An error occured, could not create other  Appointment type "
                    };
                  });
              }
              return {
                code: 200,
                message: `Appointment for ${
                  Client.clinic_number
                } on ${next_tca} was created successfully`
              };
            });
            if (create_appointment) {
              return {
                code: 200,
                message: `Appointment for ${
                  client.clinic_number
                } on ${next_tca} was created successfully`
              };
            } else {
              return {
                code: 500,
                message: "An error occured, could not create Appointment"
              };
            }
          }
        })
        .catch(e => {
          return {
            code: 500,
            message: "An error occured, could not create Appointment"
          };
        });
    } else {
      console.log(fake_missed_appointment.appntmnt_date);
      console.log(actual_date_attended);

      let diffDays = parseInt(
        moment(actual_date_attended).diff(
          fake_missed_appointment.appntmnt_date,
          "days"
        )
      );
      console.log(diffDays);
      let changed_app_status;
      if (diffDays === 0) {
        changed_app_status = "Notified";
      } else if (0 < diffDays && diffDays < 5) {
        changed_app_status = "Missed";
      } else if (4 < diffDays && diffDays < 31) {
        changed_app_status = "Defaulted";
      } else {
        changed_app_status = "LTFU";
      }

      return Appointment.update(
        {
          appointment_kept: "Yes",
          date_attended: actual_date_attended,
          active_app: "0",
          updated_at: today,
          updated_by: user.id,
          app_status: changed_app_status,
          visit_type: "Scheduled"
        },
        { where: { id: old_appointment_id } }
      )
        .then(([updated, old_app]) => {
          if (updated === 1) {
            //create new appointment

            let create_appointment = Appointment.create({
              app_status: "Booked",
              appntmnt_date: next_tca,
              status: "Active",
              sent_status: "Sent",
              client_id: client.id,
              created_at: today,
              created_by: user.id,
              app_type_1: new_appointment_type,
              entry_point: "Mobile",
              visit_type: "Scheduled",
              active_app: "1"
            }).then(new_app => {
              if (new_appointment_type == "6") {
                return OtherAppointmentType.create({
                  name: appointment_other,
                  created_by: user.id,
                  created_at: today,
                  appointment_id: new_app.id
                })
                  .then(other_app => {
                    return {
                      code: 200,
                      message: `Appointment for ${
                        Client.clinic_number
                      } on ${next_tca} was created successfully`
                    };
                  })
                  .catch(e => {
                    return {
                      code: 200,
                      message:
                        "An error occured, could not create other  Appointment type "
                    };
                  });
              }
              return {
                code: 200,
                message: `Appointment for ${
                  Client.clinic_number
                } on ${next_tca} was created successfully`
              };
            });

            if (create_appointment) {
              return {
                code: 200,
                message: `Appointment for ${
                  client.clinic_number
                } on ${next_tca} was created successfully`
              };
            } else {
              return {
                code: 500,
                message: "An error occured, could not create Appointment"
              };
            }
          }
        })
        .catch(e => {
          return {
            code: 500,
            message: e.message
          };
        });
    }
  } else {
    return {
      code: 400,
      message:
        "The selected appointment is not marked as missed or defaulted in the system"
    };
  }
}

module.exports = clearFakeAppointment;
