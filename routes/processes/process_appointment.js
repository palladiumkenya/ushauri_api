const {
    Client
} = require("../../models/client");
const moment = require("moment");
const base64 = require("base64util");
const {
    Sender
} = require("../../models/africastalking");
const {
    Message
} = require("../../models/message");
const {
    TodayAppointments
} = require("../../models/todays_appointment");


const {
    Appointment
} = require("../../models/appointment");
const {
    OtherAppointmentType
} = require('../../models/other_appointment_types');
const {
    DFCModulue,
    facilityBased,
    communityModel
} = require("../../models/dfc_module");
const e = require("express");

async function processAppointment(message, user) {
    message = message.split("*");
    message = message[1];

    message = message.split("#");

    let decoded_message = await base64.decode(message[0]);

    // check if it is a valid base 64 encode
    if (!(base64.encode(decoded_message).trim() === message[0].trim()))
        return {
            code: 400,
            message: "Your application needs to be updated to use this feature one"
        };

    decoded_message = "APP*" + decoded_message;

    const variables = decoded_message.split("*");
    // return {
    //     code: 200,
    //     message: variables.length
    // }
    if (variables.length > 8)
        return {
            code: 400,
            message: "Your application needs to be updated to use this feature two"
        };

    const app = variables[0];
    const upn = variables[1];
    let new_app_date = variables[2];
    let appointment_type = variables[3];
    const appointment_other = variables[4];
    let appointment_kept = variables[5];
    const old_appointment_id = variables[6];
    const on_dcm = variables[7]
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

    if (appointment_kept == 1) {
        appointment_kept = "Yes";
    } else if (appointment_kept == 2) {
        appointment_kept = "No";
    }
    let app_date = moment(new_app_date, "DD/MM/YYYY").format("YYYY-MM-DD");
    if (!app_date || app_date == "1970-01-01") {
        return {
            code: 400,
            message: "Invalid Appointment Date , DD/MM/YYYY is the  appropriate date format"
        };
    }

    let client = await Client.findOne({
        where: {
            clinic_number: upn
        }
    });
    if (!client)
        return {
            code: 400,
            message: ` Appointment was not scheduled in the  system , Client: ${upn} does not exist in the system. Please register them first.`
        };
    if (client.status != "Active")
        return {
            code: 400,
            message: ` Appointment was not scheduled in the  system , Client: ${upn} is not active in the system.`
        };
    if (client.mfl_code != user.facility_id) {
        return {
            code: 400,
            message: `Client ${upn} does not belong to your facility. The client is registered under MFL Code ${client.mfl_code}`
        };
    }

    if (app_date > today) {
        if (old_appointment_id == "-1") {
            let existing_appointments = await Appointment.count({
                where: {
                    client_id: client.id
                }
            });

            if (existing_appointments === 0) {
                //new booking, no record of previous appointment
                //create new appointment
                return Appointment.create({
                    app_status: "Booked",
                    appntmnt_date: app_date,
                    status: "Active",
                    sent_status: "Sent",
                    client_id: client.id,
                    created_at: today,
                    created_by: user.id,
                    app_type_1: appointment_type,
                    entry_point: "Mobile",
                    visit_type: "Scheduled",
                    active_app: "1"
                }).then(async (new_app) => {
                    if (appointment_type == "6") {
                        return OtherAppointmentType.create({
                            name: appointment_other,
                            created_by: user.id,
                            created_at: today,
                            appointment_id: new_app.id
                        }).then(async (other_app) => {

                            return {
                                code: 200,
                                message: `Appointment for ${client.f_name} UPN: ${upn} on ${app_date} was created successfully`
                            };
                        }).catch(e => {
                            return {
                                code: 400,
                                message: "An error occured, could not create other  Appointment type "
                            };
                        })

                    }

                    // await TodayAppointments.destroy({
                    //     where: {
                    //         client_no: upn
                    //     }
                    // })

                    return {
                        code: 200,
                        message: `Appointment for ${client.f_name} UPN:  ${upn} on ${app_date} was created successfully`
                    };
                }).catch(e => {
                    return {
                        code: 500,
                        message: "An error occured, could not create Appointment"
                    };
                })

            } else {
                // appointment history exists

                let active_appointment = await Appointment.count({
                    where: {
                        client_id: client.id,
                        active_app: "1"
                    }
                });
                if (active_appointment > 0) {
                    //check if date of appointment is less than today
                    let active_appointment_details = await Appointment.findOne({
                        where: {
                            client_id: client.id,
                            active_app: "1"
                        }
                    });
                    //if less, redirect user to the defaulter diary to update appointment

                    if (
                        moment(active_appointment_details.appntmnt_date).isBefore(
                            new Date().toDateString()
                        )
                    ) {
                        return {
                            code: 400,
                            message: `Client ${upn} missed an appointment on date ${
                                active_appointment_details.appntmnt_date
                            }. Kindly update them from the defaulter diary`
                        };
                    } else if (
                        moment(active_appointment_details.appntmnt_date).isSame(
                            new Date().toDateString()
                        )
                    ) {
                        return {
                            code: 400,
                            message: `Client ${upn} has an active appointment today. Kindly update them from today's appointments`
                        };
                    } else {
                        if (active_appointment_details.sent_flag == '1') {
                            try {
                                //check future dates
                                let get_future_dates = await Appointment.findAll({
                                    where: {
                                        client_id: client.id,
                                        active_app: '1'
                                    }
                                })
                                if (get_future_dates) {
                                    const future_dates = get_future_dates.filter(get_future => moment(get_future.appntmnt_date).isAfter(today))
                                    if (future_dates.length > 1) {
                                        //check if new app is same as future
                                        if (moment(future_dates[0].appntmnt_date).isSame(app_date) || moment(future_dates[1].appntmnt_date).isSame(app_date))
                                            return {
                                                code: 400,
                                                message: `Client ${upn} under Differentiated Service Module has an appointment scheduled on ${app_date} and cannot be booked again`
                                            }
                                        // if (appointment_type > 2)
                                        //     return {
                                        //         code: 400,
                                        //         message: `Client ${client.clinic_number} is under the Differentiated Service Module, you can only select a Refill or a Clinical Review appointment type`
                                        //     }
                                        return Appointment.update({
                                            appointment_kept: "Yes",
                                            date_attended: today,
                                            active_app: "0",
                                            updated_at: today,
                                            unscheduled_date: today,
                                            updated_by: user.id,
                                            app_status: "Notified",
                                            visit_type: "Un-Scheduled"
                                        }, {
                                            individualHooks: true,
                                            where: {
                                                id: active_appointment_details.id
                                            }
                                        }).then(async ([updated, old_app_]) => {
                                            if (old_app_) {
                                                let get_future_dates_next = await Appointment.findOne({
                                                    limit: 1,
                                                    where: {
                                                        client_id: active_appointment_details.client_id,
                                                        active_app: '1'
                                                    },
                                                    order: [
                                                        ["id", "DESC"]
                                                    ],
                                                })
                                                if (get_future_dates_next) {
                                                    //close the other active appointment
                                                    return Appointment.update({
                                                        appointment_kept: "Yes",
                                                        date_attended: today,
                                                        active_app: "0",
                                                        reason: 'DSM: Previous appointment marked as Un-Scheduled',
                                                        updated_at: today,
                                                        updated_by: user.id,
                                                        app_status: "Notified",
                                                    }, {
                                                        where: {
                                                            id: get_future_dates_next.id
                                                        }
                                                    }).then(([updated, next_app]) => {
                                                        if (updated) {
                                                            return {
                                                                code: 200,
                                                                message: `The Differentiated Service Module Appointment for client: ${client.clinic_number} on ${future_dates[0].appntmnt_date} has been marked as Un-Scheduled. The client had another active appointment on  ${future_dates[1].appntmnt_date} which has been closed. Kindly go to
                                                                the DSD Module to schedule new appointments.`
                                                            }
                                                            // return Appointment.create({
                                                            //     app_status: "Booked",
                                                            //     appntmnt_date: app_date,
                                                            //     status: "Active",
                                                            //     sent_flag: '1',
                                                            //     sent_status: "Sent",
                                                            //     client_id: client.id,
                                                            //     created_at: today,
                                                            //     created_by: user.id,
                                                            //     app_type_1: appointment_type,
                                                            //     entry_point: "Mobile",
                                                            //     visit_type: "Scheduled",
                                                            //     active_app: "1"
                                                            // }, {
                                                            //     individualHooks: true
                                                            // }).then((new_apps) => {
                                                            //     let dcm_client = {}
                                                            //     dcm_client.client_id = new_apps.client_id
                                                            //     dcm_client.duration_more = 'Stable'
                                                            //     dcm_client.stability_status = 'DCM'
                                                            //     dcm_client.refill_date = new_apps.app_type_1 != '1' ? null : new_apps.appntmnt_date
                                                            //     dcm_client.clinical_visit_date = new_apps.app_type_1 != '2' ? null : new_apps.appntmnt_date
                                                            //     dcm_client.created_by = new_apps.created_by
                                                            //     dcm_client.appointment_id = new_apps.id
                                                            //     let new_dfc = DFCModulue.create(dcm_client).catch((e) => {
                                                            //         return {
                                                            //             success: false,
                                                            //             message: e.message,
                                                            //         };

                                                            //     })
                                                            //     if (new_dfc) {
                                                            //         return {
                                                            //             code: 200,
                                                            //             message: `The Differentiated Service Module Appointment for client ${client.clinic_number} was created for the date ${app_date}.`
                                                            //         }
                                                            //     }
                                                            // }).catch(e => {
                                                            //     return {
                                                            //         code: 200,
                                                            //         message: 'An error occured, could not create Appointment'
                                                            //     }
                                                            // })
                                                        }

                                                    })


                                                }
                                                //console.log(future_dates.appntmnt_date)

                                            }
                                        })
                                    } else {
                                        if (moment(future_dates[0].appntmnt_date).isSame(app_date))

                                            return {
                                                code: 400,
                                                message: `Client ${upn} under Differentiated Service Module has an appointment scheduled on ${app_date} and cannot be booked again`
                                            }
                                        // if (appointment_type > 2)
                                        //     return {
                                        //         code: 400,
                                        //         message: `Client ${client.clinic_number} is under the Differentiated Service Module, you can only select a Refill or a Clinical Review appointment type`
                                        //     }
                                        return Appointment.update({
                                            appointment_kept: "Yes",
                                            date_attended: today,
                                            active_app: "0",
                                            updated_at: today,
                                            unscheduled_date: today,
                                            updated_by: user.id,
                                            app_status: "Notified",
                                            visit_type: "Un-Scheduled"
                                        }, {
                                            individualHooks: true,
                                            where: {
                                                id: active_appointment_details.id
                                            }
                                        }).then(async ([updated, single_app]) => {
                                            if (updated) {
                                                return {
                                                    code: 200,
                                                    message: `The Differentiated Service Module Appointment for client: ${client.clinic_number} on ${future_dates[0].appntmnt_date} has been marked as Un-Scheduled. Kindly go to the DSD Module to schedule new appointments.`

                                                }

                                            }
                                        })
                                    }

                                }
                            } catch (e) {
                                return {
                                    code: 500,
                                    message: 'An error occurred, could not create Appointment'
                                    //message: e.message
                                }
                            }
                        } else {

                            //if greater than today, if current active date is equal to new app date, return error

                            if (
                                moment(active_appointment_details.appntmnt_date).isSame(app_date)
                            )
                                return {
                                    code: 400,
                                    message: `Client ${upn} already has an appointment on ${app_date} and cannot be booked again.`
                                };
                            //if new app date - today > 30 days, return cannot book unscheduled > 30 days

                            //let diff_days = moment(app_date).diff(today, "days");
                            // if (diff_days > 30) {
                            //     return {
                            //         code: 400,
                            //         message: `Cannot book an Un-Scheduled visit which is more than 30 days from the original date of appointment`
                            //     };
                            // }
                            // if less than 30 days, book unscheduled

                            return Appointment.update({
                                appointment_kept: "Yes",
                                date_attended: today,
                                active_app: "0",
                                updated_at: today,
                                unscheduled_date: today,
                                updated_by: user.id,
                                app_status: "Notified",
                                visit_type: "Un-Scheduled"
                            }, {
                                where: {
                                    id: active_appointment_details.id
                                }
                            })
                                .then(([updated, old_app]) => {
                                    if (updated) {
                                        //create new appointment
                                        return Appointment.create({
                                            app_status: "Booked",
                                            appntmnt_date: app_date,
                                            status: "Active",
                                            sent_status: "Sent",
                                            client_id: client.id,
                                            created_at: today,
                                            created_by: user.id,
                                            app_type_1: appointment_type,
                                            entry_point: "Mobile",
                                            visit_type: "Scheduled",
                                            active_app: "1"
                                        }).then(async (new_app) => {
                                            if (appointment_type == "6") {
                                                return OtherAppointmentType.create({
                                                    name: appointment_other,
                                                    created_by: user.id,
                                                    created_at: today,
                                                    appointment_id: new_app.id
                                                }).then(async (other_app) => {
                                                    // await TodayAppointments.destroy({
                                                    //     where: {
                                                    //         client_no: upn
                                                    //     }
                                                    // })
                                                    return {
                                                        code: 200,
                                                        message: `Appointment for ${client.f_name} UPN: ${upn} on ${app_date} was created successfully`
                                                    };
                                                }).catch(e => {
                                                    return {
                                                        code: 500,
                                                        message: "An error occurred, could not create other  Appointment type "
                                                    };
                                                })

                                            }
                                            // await TodayAppointments.destroy({
                                            //     where: {
                                            //         client_no: upn
                                            //     }
                                            // })
                                            return {
                                                code: 200,
                                                message: `Appointment for ${client.f_name} UPN:  ${upn} on ${app_date} was created successfully`
                                            };
                                        }).catch(e => {
                                            return {
                                                code: 500,
                                                message: "An error occured, could not create Appointment"
                                            };
                                        })
                                    }
                                })
                                .catch(e => {
                                    return {
                                        code: 500,
                                        message: "An error occured, could not create Appointment"
                                    };
                                });
                        }

                    }
                } else {
                    //no active appointment exits, create new appointment
                    return Appointment.create({
                        app_status: "Booked",
                        appntmnt_date: app_date,
                        status: "Active",
                        sent_status: "Sent",
                        client_id: client.id,
                        created_at: today,
                        created_by: user.id,
                        app_type_1: appointment_type,
                        entry_point: "Mobile",
                        visit_type: "Scheduled",
                        active_app: "1"
                    }).then((new_app) => {
                        if (appointment_type == "6") {
                            return OtherAppointmentType.create({
                                name: appointment_other,
                                created_by: user.id,
                                created_at: today,
                                appointment_id: new_app.id
                            }).then((other_app) => {
                                return {
                                    code: 200,
                                    message: `Appointment for ${client.f_name} UPN : ${upn} on ${app_date} was created successfully`
                                };
                            }).catch(e => {
                                return {
                                    code: 500,
                                    message: "An error occured, could not create other  Appointment type "
                                };
                            })

                        }
                        return {
                            code: 200,
                            message: `Appointment for ${client.f_name} UPN : ${upn} on ${app_date} was created successfully`
                        };
                    }).catch(e => {
                        return {
                            code: 500,
                            message: "An error occured, could not create Appointment"
                        };
                    })
                }
            }
        } else {
            //get appointment where id is old app id
            // if old app is today, confirm current as kept, create new

            let current_active_appointment = await Appointment.findByPk(
                old_appointment_id
            );
            if (!current_active_appointment)
                return {
                    code: 400,
                    message: `The appointment you tried to update does not exist.`
                };
            let active_appointment_date = moment(
                current_active_appointment.appntmnt_date
            );
            let current_date = moment(new Date().toDateString());
            let diffDays = current_date.diff(active_appointment_date, "days");
            if (diffDays === 0) {
                //mark active appointment as kept

                const active_appointment_on_same_date = await Appointment.count({
                    where: {
                        appntmnt_date: app_date,
                        client_id: client.id
                    }
                });
                if (on_dcm == 'YES') {
                    if (current_active_appointment.sent_flag == '1') {
                        try {
                            //check if future appointment exists first
                            let get_client_apps = await Appointment.findAll({
                                where: {
                                    client_id: client.id,
                                    active_app: '1'
                                }
                            })
                            if (get_client_apps) {
                                // if (appointment_type > 2)
                                //     return {
                                //         code: 400,
                                //         message: `Client ${client.clinic_number} is under the Differentiated Service Module, you can only select a Refill or a Clinical Review appointment type`
                                //     }
                                const more_than_today = get_client_apps.filter(get_client => moment(get_client.appntmnt_date).isAfter(today))
                                if (more_than_today.length > 0) {
                                    if (active_appointment_on_same_date === 0 || active_appointment_on_same_date > 0) {
                                        return Appointment.update({
                                            appointment_kept: "Yes",
                                            date_attended: today,
                                            active_app: "0",
                                            updated_at: today,
                                            updated_by: user.id,
                                            app_status: "Notified",
                                            visit_type: "Scheduled"
                                        }, {
                                            individualHooks: true,
                                            where: {
                                                id: old_appointment_id
                                            }
                                        }).then(([updated, [app_details]]) => {
                                            return {
                                                code: 200,
                                                message: ` Differentiated Service Module Appointment for  ${upn} on ${app_date} was updated successfully. The client has another appointment scheduled on ${more_than_today[0].appntmnt_date}`
                                            }
                                        })
                                    }

                                } else if (more_than_today.length === 0) {
                                    if (active_appointment_on_same_date === 0) {
                                        return Appointment.update({
                                            appointment_kept: "Yes",
                                            date_attended: today,
                                            active_app: "0",
                                            updated_at: today,
                                            updated_by: user.id,
                                            app_status: "Notified",
                                            visit_type: "Scheduled"
                                        }, {
                                            individualHooks: true,
                                            where: {
                                                id: old_appointment_id
                                            }
                                        }).then(([updated, [app_details]]) => {
                                            return {
                                                code: 200,
                                                message: ` Differentiated Service Module Appointment for ${upn} was updated successfully. Kindly schedule new appointments from the Differentiated Service Module icon`
                                            }
                                        })
                                    }
                                } else {
                                }

                            }
                        } catch (error) {

                        }
                    } else {
                        return Appointment.update({
                            sent_flag: '1'
                        }, {
                            individualHooks: true,
                            where: {
                                id: current_active_appointment.id
                            }
                        }).then(async ([updated, sent_dcm_column]) => {
                            if (updated) {
                                try {
                                    //check if future appointment exists first
                                    let get_client_apps = await Appointment.findAll({
                                        where: {
                                            client_id: client.id,
                                            active_app: '1'
                                        }
                                    })
                                    if (get_client_apps) {
                                        // if (appointment_type > 2)
                                        //     return {
                                        //         code: 400,
                                        //         message: `Client ${client.clinic_number} is under the Differentiated Service Module, you can only select a Refill or a Clinical Review appointment type`
                                        //     }
                                        const more_than_today = get_client_apps.filter(get_client => moment(get_client.appntmnt_date).isAfter(today))
                                        if (more_than_today.length > 0) {
                                            if (active_appointment_on_same_date === 0) {
                                                return Appointment.update({
                                                    appointment_kept: "Yes",
                                                    date_attended: today,
                                                    active_app: "0",
                                                    updated_at: today,
                                                    updated_by: user.id,
                                                    app_status: "Notified",
                                                    visit_type: "Scheduled"
                                                }, {
                                                    individualHooks: true,
                                                    where: {
                                                        id: old_appointment_id
                                                    }
                                                }).then(([updated, [app_details]]) => {
                                                    return {
                                                        code: 200,
                                                        message: ` Differentiated Service Module Appointment for  ${upn} on ${app_date} was updated successfully. The client has another appointment scheduled on ${more_than_today[0].appntmnt_date}`
                                                    }
                                                })
                                            }

                                        } else if (more_than_today.length === 0) {
                                            if (active_appointment_on_same_date === 0) {
                                                return Appointment.update({
                                                    appointment_kept: "Yes",
                                                    date_attended: today,
                                                    active_app: "0",
                                                    updated_at: today,
                                                    updated_by: user.id,
                                                    app_status: "Notified",
                                                    visit_type: "Scheduled"
                                                }, {
                                                    individualHooks: true,
                                                    where: {
                                                        id: old_appointment_id
                                                    }
                                                }).then(([updated, [app_details]]) => {
                                                    return {
                                                        code: 200,
                                                        message: ` Differentiated Service Module Appointment for ${upn} was updated successfully. Kindly schedule new appointments from the Differentiated Service Module icon`
                                                    }
                                                })
                                            }
                                        } else {
                                        }

                                    }
                                } catch (error) {

                                }
                            }
                        })

                    }

                } else {
                    if (active_appointment_on_same_date === 0) {
                        return Appointment.update({
                            appointment_kept: "Yes",
                            date_attended: today,
                            active_app: "0",
                            updated_at: today,
                            updated_by: user.id,
                            app_status: "Notified",
                            visit_type: "Scheduled"
                        }, {
                            where: {
                                id: old_appointment_id
                            }
                        })
                            .then(async ([updated, old_app]) => {


                                if (updated) {
                                    //create new appointment
                                    return Appointment.create({
                                        app_status: "Booked",
                                        appntmnt_date: app_date,
                                        status: "Active",
                                        sent_status: "Sent",
                                        client_id: client.id,
                                        created_at: today,
                                        created_by: user.id,
                                        app_type_1: appointment_type,
                                        entry_point: "Mobile",
                                        visit_type: "Scheduled",
                                        active_app: "1"
                                    }).then(async (new_app) => {
                                        if (appointment_type == "6") {
                                            return OtherAppointmentType.create({
                                                name: appointment_other,
                                                created_by: user.id,
                                                created_at: today,
                                                appointment_id: new_app.id
                                            }).then((other_app) => {
                                                return {
                                                    code: 200,
                                                    message: `Appointment for ${upn} on ${app_date} was created successfully`
                                                };
                                            }).catch(e => {
                                                return {
                                                    code: 500,
                                                    message: "An error occurred, could not create other  Appointment type "
                                                };
                                            })

                                        }
                                        let nameCapitalized = client.f_name.charAt(0).toUpperCase() + client.f_name.slice(1)
                                        if (client.smsenable == "Yes" && client.language_id != 5) {
                                            let message = await Message.findOne({
                                                where: {
                                                    message_type_id: 1,
                                                    logic_flow: 1,
                                                    language_id: client.language_id
                                                }
                                            });
                                            let phone;
                                            message = message.message;
                                            let new_message = message.replace("XXX", nameCapitalized);

                                            if (client.phone_no != null) {
                                                phone = client.phone_no
                                            } else if (client.phone_no == null && client.alt_phone_no != null) {
                                                phone = client.alt_phone_no

                                            }

                                            if (phone) {
                                                Sender(phone, new_message);
                                            }
                                        }

                                        return {
                                            code: 200,
                                            message: `Appointment for ${upn} on ${app_date} was created successfully`
                                        };
                                    }).catch(e => {
                                        return {
                                            code: 500,
                                            message: "An error occurred, could not create Appointment"
                                        };
                                    })


                                }


                            })
                            .catch(e => {
                                return {
                                    code: 500,
                                    message: "An error occured, could not update old Appointment"
                                };
                            });

                    } else {
                        return {
                            code: 400,
                            message: `Client ${upn} already has an appointment on ${app_date} and cannot be booked again.`
                        };
                    }
                }


            } else {
                return {
                    code: 500,
                    message: "An error occured, could not create Appointment"
                };
            }
        }
    } else {
        return {
            code: 400,
            message: `Appointments can only be booked for dates greater than today.`
        };
    }
}

module.exports = processAppointment;
