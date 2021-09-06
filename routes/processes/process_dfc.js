const express = require("express");
const moment = require("moment");
const _ = require("lodash");
const Op = require("sequelize").Op;
const router = express.Router();
const {
    date
} = require("joi");
const {
    Client
} = require("../../models/client");
const {
    Appointment
} = require("../../models/appointment");
const {
    User
} = require("../../models/user");
const {
    DFCModulue,
    facilityBased,
    communityModel
} = require("../../models/dfc_module");
const {
    Clinic
} = require("../../models/clinic");
const {
    masterFacility
} = require('../../models/master_facility');
const {
    OtherAppointmentType
} = require("../../models/other_appointment_types");
const {
    create
} = require("lodash");
moment.createFromInputFallback = function(config) {
    config._d = new Date(config._i);
};

router.post('/check/enrollment/duration', async(req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number

    let check_user = await User.findOne({
        where: {
            phone_no,
        },
    })

    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })

    let client = await Client.findOne({
        where: {
            clinic_number,
        },
    })

    if (!client)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} does not exist in the system`
        })
    let get_facility = await masterFacility.findOne({
        where: {
            code: client.mfl_code
        },
        attributes: ["code", "name"],
    })
    if (!get_facility)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a facility`
        })

    let get_clinic = await Clinic.findOne({
        where: {
            id: client.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_clinic)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a clinic`
        })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_user_clinic)
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not assigned to a clinic`
        })

    if (client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
        })
    if (client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })
    if (check_user.status != "Active")
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not active in the system.`
        })
    let now = moment(new Date()).format("YYYY-MM-DD");
    let client_art_date = moment(client.art_date).format("YYYY-MM-DD");
    let monthDifference = Math.round(moment(now).diff(client_art_date, "months", true))
    if (monthDifference > 12) {
        res.json({
            success: true,
            months: monthDifference
        })
    } else if (monthDifference < 12) {
        res.json({
            success: true,
            months: monthDifference
        })
    }
})
router.post('/well/advanced/booking', async(req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number
    let appointment_date = req.body.appointment_date
    let appointment_type = req.body.appointment_type
    let appointment_other = req.body.appointment_other
    let category = req.body.category_type
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

    let check_client = await Client.findOne({
        where: {
            clinic_number
        }
    })
    if (!check_client)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} does not exist in the system`

        })
    let check_user = await User.findOne({
        where: {
            phone_no
        }
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })
    let get_facility = await masterFacility.findOne({
        where: {
            code: check_client.mfl_code
        },
        attributes: ["code", "name"],
    })

    if (!get_facility)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a facility`
        })

    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_clinic)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a clinic`
        })

    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_user_clinic)
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not assigned to a clinic`
        })
    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your facility, the client is mapped to ${get_facility.name}`
        })
    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`

        })

    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })
    if (check_user.status != "Active")
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not active in the system.`
        })

    let existing_appointment = await Appointment.count({
        where: {
            client_id: check_client.id
        }
    })

    if (existing_appointment === 0) {
        return Appointment.create({
            app_status: "Booked",
            appntmnt_date: appointment_date,
            status: "Active",
            sent_flag: '1',
            sent_status: "Sent",
            client_id: check_client.id,
            created_at: today,
            created_by: check_user.id,
            app_type_1: appointment_type,
            entry_point: "Mobile",
            visit_type: "Scheduled",
            active_app: "1"
        }).then((app) => {
            if (appointment_type == '6') {
                return OtherAppointmentType.create({
                    name: appointment_other,
                    created_by: check_user.id,
                    created_at: today,
                    appointment_id: app.id

                }).then((other_app) => {
                    let dfc_create = {}
                    dfc_create.client_id = check_client.id
                        //dfc_create.date_created = moment(new Date()).format("YYYY-MM-DD H:m:s")
                    dfc_create.duration_less = category === 1 ? 'Well' : 'Advanced'
                    dfc_create.created_by = check_user.id
                    dfc_create.appointment_id = app.id

                    let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                        res.json({
                            success: false,
                            message: e.message,
                        });

                    })
                    if (new_dfc) {
                        res.json({
                            success: true,
                            message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                        })
                    }
                }).catch(e => {
                    return res.json({
                        success: false,
                        message: "An error occured, could not create Appointment type other"
                    })
                })
            }
            let dfc_create = {}
            dfc_create.client_id = check_client.id
                //dfc_create.date_created = moment(new Date()).format("YYYY-MM-DD H:m:s")
            dfc_create.duration_less = category === 1 ? 'Well' : 'Advanced'
            dfc_create.created_by = check_user.id
            dfc_create.appointment_id = app.id

            let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                res.json({
                    success: false,
                    message: e.message,
                });

            })
            if (new_dfc) {
                res.json({
                    success: true,
                    message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                })
            }

        }).catch(e => {
            return res.json({
                success: false,
                message: "An error occured, could not create Appointment"
            })
        })

    } else {
        //appointment history available
        let active_appointment = await Appointment.count({
            where: {
                client_id: check_client.id,
                active_app: '1'
            }
        })
        console.log(active_appointment)
        if (active_appointment) {
            //check if date of app is less than curr date
            let active_appointment = await Appointment.findOne({
                where: {
                    client_id: check_client.id,
                    active_app: '1'
                }
            })
            if (active_appointment) {
                if (moment(active_appointment.appntmnt_date).isBefore(
                        new Date().toDateString()
                    )) {
                    return Appointment.update({
                            sent_flag: '1',
                        }, {
                            where: {
                                id: active_appointment.id
                            }
                        }).then(([updated, old_app]) => {
                            if (updated) {
                                return res.json({
                                    success: false,
                                    message: `Client ${clinic_number} missed an appointment on date ${active_appointment.appntmnt_date}. Kindly update then from the defaulter diary`,
                                    status: 'Defaulter'
                                })

                            }
                        })
                        //check if date is same as curr date
                } else if (moment(active_appointment.appntmnt_date).isSame(
                        new Date().toDateString()
                    )) {
                    return Appointment.update({
                        sent_flag: '1',
                    }, {
                        where: {
                            id: active_appointment.id
                        }
                    }).then(([updated, old_app]) => {
                        if (updated) {
                            return res.json({
                                success: false,
                                message: `Client ${clinic_number} has an active appointment today. Kindly update them from today's appointment`,
                                status: 'Appointment'
                            })

                        }
                    })
                } else if (moment(active_appointment.appntmnt_date).isSame(appointment_date)) {
                    return Appointment.update({
                        sent_flag: '1',
                    }, {
                        where: {
                            id: active_appointment.id
                        }
                    }).then(([updated, old_app]) => {
                        if (updated) {
                            return res.json({
                                success: false,
                                message: `Client ${clinic_number} already has an appointment on ${appointment_date} and cannot be booked again`
                            })

                        }
                    })

                } else {
                    //mark as unscheduled
                    return Appointment.update({
                        appointment_kept: "Yes",
                        date_attended: today,
                        active_app: "0",
                        updated_at: today,
                        unscheduled_date: today,
                        updated_by: check_user.id,
                        app_status: "Notified",
                        visit_type: "Un-Scheduled"
                    }, {
                        where: {
                            id: active_appointment.id
                        }
                    }).then(([updated, old_app]) => {
                        if (updated) {
                            //schedule a new one
                            return Appointment.create({
                                app_status: "Booked",
                                appntmnt_date: appointment_date,
                                status: "Active",
                                sent_flag: '1',
                                sent_status: "Sent",
                                client_id: check_client.id,
                                created_at: today,
                                created_by: check_user.id,
                                app_type_1: appointment_type,
                                entry_point: "Mobile",
                                visit_type: "Scheduled",
                                active_app: "1"
                            }).then((new_app) => {
                                if (appointment_type == '6') {
                                    return OtherAppointmentType.create({
                                        name: appointment_other,
                                        created_by: check_user.id,
                                        created_at: today,
                                        appointment_id: new_app.id
                                    }).then((other_n_app) => {
                                        let dfc_create_new = {}
                                        dfc_create_new.client_id = check_client.id
                                        dfc_create_new.duration_less = category === 1 ? 'Well' : 'Advanced'
                                        dfc_create_new.created_by = check_user.id
                                        dfc_create_new.appointment_id = new_app.id

                                        let dfc_create_other = DFCModulue.create(dfc_create_new).catch((e) => {
                                            res.json({
                                                success: false,
                                                message: e.message,
                                            })

                                        })
                                        if (dfc_create_other) {
                                            res.json({
                                                success: true,
                                                message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                            })
                                        }

                                    }).catch(e => {
                                        return res.json({
                                            success: false,
                                            message: "An error occured, could not create Appointment type other"
                                        })
                                    })

                                }
                                let dfc_create_new = {}
                                dfc_create_new.client_id = check_client.id
                                dfc_create_new.duration_less = category === 1 ? 'Well' : 'Advanced'
                                dfc_create_new.created_by = check_user.id
                                dfc_create_new.appointment_id = new_app.id

                                let new_dfc = DFCModulue.create(dfc_create_new).catch((e) => {
                                    res.json({
                                        success: false,
                                        message: e.message,
                                    });

                                })
                                if (new_dfc) {
                                    res.json({
                                        success: true,
                                        message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                    })
                                }
                            }).catch(e => {
                                return res.json({
                                    success: false,
                                    message: 'An error occured, could not create Appointment'
                                })
                            })

                        }
                    })
                }
            }
        } else if (active_appointment === 0) {
            return Appointment.create({
                app_status: "Booked",
                appntmnt_date: appointment_date,
                status: "Active",
                sent_flag: '1',
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: appointment_type,
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }).then((app) => {
                if (appointment_type == '6') {
                    return OtherAppointmentType.create({
                        name: appointment_other,
                        created_by: check_user.id,
                        created_at: today,
                        appointment_id: app.id

                    }).then((other_app) => {
                        let dfc_create = {}
                        dfc_create.client_id = check_client.id
                        dfc_create.duration_less = category === 1 ? 'Well' : 'Advanced'
                        dfc_create.created_by = check_user.id
                        dfc_create.appointment_id = app.id

                        let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                            res.json({
                                success: false,
                                message: e.message,
                            });

                        })
                        if (new_dfc) {
                            res.json({
                                success: true,
                                message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                            })
                        }
                    }).catch(e => {
                        return res.json({
                            success: false,
                            message: "An error occured, could not create Appointment type other"
                        })
                    })
                }
                let dfc_create = {}
                dfc_create.client_id = check_client.id
                dfc_create.duration_less = category === 1 ? 'Well' : 'Advanced'
                dfc_create.created_by = check_user.id
                dfc_create.appointment_id = app.id

                let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message,
                    });

                })
                if (new_dfc) {
                    res.json({
                        success: true,
                        message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                    })
                }
            }).catch(e => {
                return res.json({
                    success: false,
                    message: 'An error occured, could not create Appointment'
                })
            })
        }
    }


})
router.post('/unstable/client/booking', async(req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number
    let appointment_date = req.body.appointment_date
    let appointment_type = req.body.appointment_type
    let appointment_other = req.body.appointment_other
    let category = req.body.category_type
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

    let check_client = await Client.findOne({
        where: {
            clinic_number
        }
    })
    if (!check_client)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} does not exist in the system`

        })

    let check_user = await User.findOne({
        where: {
            phone_no
        }
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })

    let get_facility = await masterFacility.findOne({
        where: {
            code: check_client.mfl_code
        },
        attributes: ["code", "name"],
    })
    if (!get_facility)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a facility`
        })

    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_clinic)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a clinic`
        })

    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_user_clinic)
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not assigned to a clinic`
        })

    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your facility, the client is mapped to ${get_facility.name}`
        })
    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`

        })

    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })
    if (check_user.status != "Active")
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not active in the system.`
        })

    let existing_appointment = await Appointment.count({
        where: {
            client_id: check_client.id
        }
    })

    if (existing_appointment === 0) {
        return Appointment.create({
            app_status: "Booked",
            appntmnt_date: appointment_date,
            status: "Active",
            sent_flag: '1',
            sent_status: "Sent",
            client_id: check_client.id,
            created_at: today,
            created_by: check_user.id,
            app_type_1: appointment_type,
            entry_point: "Mobile",
            visit_type: "Scheduled",
            active_app: "1"
        }).then((app) => {
            if (appointment_type == '6') {
                return OtherAppointmentType.create({
                    name: appointment_other,
                    created_by: check_user.id,
                    created_at: today,
                    appointment_id: app.id

                }).then((other_app) => {
                    let dfc_create = {}
                    dfc_create.client_id = check_client.id
                    dfc_create.duration_more = 'Unstable'
                    dfc_create.created_by = check_user.id
                    dfc_create.appointment_id = app.id

                    let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                        res.json({
                            success: false,
                            message: e.message,
                        });

                    })
                    if (new_dfc) {
                        res.json({
                            success: true,
                            message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                        })
                    }
                }).catch(e => {
                    return res.json({
                        success: false,
                        message: "An error occured, could not create Appointment type other"
                    })
                })
            }
            let dfc_create = {}
            dfc_create.client_id = check_client.id
            dfc_create.duration_more = 'Unstable'
            dfc_create.created_by = check_user.id
            dfc_create.appointment_id = app.id

            let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                res.json({
                    success: false,
                    message: e.message,
                });

            })
            if (new_dfc) {
                res.json({
                    success: true,
                    message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                })
            }

        }).catch(e => {
            return res.json({
                success: false,
                message: "An error occured, could not create Appointment"
            })
        })

    } else {
        //appointment history available
        let active_appointment = await Appointment.count({
            where: {
                client_id: check_client.id,
                active_app: '1'
            }
        })
        if (active_appointment) {
            //check if date of app is less than curr date
            let active_appointment = await Appointment.findOne({
                where: {
                    client_id: check_client.id,
                    active_app: '1'
                }
            })
            if (active_appointment) {
                if (moment(active_appointment.appntmnt_date).isBefore(
                        new Date().toDateString()
                    )) {
                    return Appointment.update({
                            sent_flag: '1',
                        }, {
                            where: {
                                id: active_appointment.id
                            }
                        }).then(([updated, old_app]) => {
                            if (updated) {
                                return res.json({
                                    success: false,
                                    message: `Client ${clinic_number} missed an appointment on date ${active_appointment.appntmnt_date}. Kindly update then from the defaulter diary`,
                                    status: 'Defaulter'
                                })

                            }
                        })
                        //check if date is same as curr date
                } else if (moment(active_appointment.appntmnt_date).isSame(
                        new Date().toDateString()
                    )) {
                    return Appointment.update({
                        sent_flag: '1',
                    }, {
                        where: {
                            id: active_appointment.id
                        }
                    }).then(([updated, old_app]) => {
                        if (updated) {
                            return res.json({
                                success: false,
                                message: `Client ${clinic_number} has an active appointment today. Kindly update them from today's appointment`,
                                status: 'Appointment'
                            })

                        }
                    })
                } else if (moment(active_appointment.appntmnt_date).isSame(appointment_date)) {
                    return Appointment.update({
                        sent_flag: '1',
                    }, {
                        where: {
                            id: active_appointment.id
                        }
                    }).then(([updated, old_app]) => {
                        if (updated) {
                            return res.json({
                                success: false,
                                message: `Client ${clinic_number} already has an appointment on ${appointment_date} and cannot be booked again`
                            })

                        }
                    })

                } else {
                    //mark as unscheduled
                    return Appointment.update({
                        appointment_kept: "Yes",
                        date_attended: today,
                        active_app: "0",
                        updated_at: today,
                        unscheduled_date: today,
                        updated_by: check_user.id,
                        app_status: "Notified",
                        visit_type: "Un-Scheduled"
                    }, {
                        where: {
                            id: active_appointment.id
                        }
                    }).then(([updated, old_app]) => {
                        if (updated) {
                            //schedule a new one
                            return Appointment.create({
                                app_status: "Booked",
                                appntmnt_date: appointment_date,
                                status: "Active",
                                sent_flag: '1',
                                sent_status: "Sent",
                                client_id: check_client.id,
                                created_at: today,
                                created_by: check_user.id,
                                app_type_1: appointment_type,
                                entry_point: "Mobile",
                                visit_type: "Scheduled",
                                active_app: "1"
                            }).then((new_app) => {
                                if (appointment_type == '6') {
                                    return OtherAppointmentType.create({
                                        name: appointment_other,
                                        created_by: check_user.id,
                                        created_at: today,
                                        appointment_id: new_app.id
                                    }).then((other_n_app) => {
                                        let dfc_create_new = {}
                                        dfc_create_new.client_id = check_client.id
                                        dfc_create_new.duration_more = 'Unstable'
                                        dfc_create_new.created_by = check_user.id
                                        dfc_create_new.appointment_id = new_app.id

                                        let dfc_create_other = DFCModulue.create(dfc_create_new).catch((e) => {
                                            res.json({
                                                success: false,
                                                message: e.message,
                                            })

                                        })
                                        if (dfc_create_other) {
                                            res.json({
                                                success: true,
                                                message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                            })
                                        }

                                    }).catch(e => {
                                        return res.json({
                                            success: false,
                                            message: "An error occured, could not create Appointment type other"
                                                //message: e.message
                                        })
                                    })

                                }
                                let dfc_create_new = {}
                                dfc_create_new.client_id = check_client.id
                                dfc_create_new.duration_more = 'Unstable'
                                dfc_create_new.created_by = check_user.id
                                dfc_create_new.appointment_id = new_app.id

                                let new_dfc = DFCModulue.create(dfc_create_new).catch((e) => {
                                    res.json({
                                        success: false,
                                        message: e.message,
                                    });

                                })
                                if (new_dfc) {
                                    res.json({
                                        success: true,
                                        message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                    })
                                }
                            }).catch(e => {
                                return res.json({
                                    success: false,
                                    message: 'An error occured, could not create Appointment'
                                        //message: e.message
                                })
                            })

                        }
                    })
                }
            }
        } else {
            return Appointment.create({
                app_status: "Booked",
                appntmnt_date: appointment_date,
                status: "Active",
                sent_flag: '1',
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: appointment_type,
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }).then((app) => {
                if (appointment_type == '6') {
                    return OtherAppointmentType.create({
                        name: appointment_other,
                        created_by: check_user.id,
                        created_at: today,
                        appointment_id: app.id

                    }).then((other_app) => {
                        let dfc_create = {}
                        dfc_create.client_id = check_client.id
                        dfc_create.duration_more = 'Unstable'
                        dfc_create.created_by = check_user.id
                        dfc_create.appointment_id = app.id

                        let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                            res.json({
                                success: false,
                                message: e.message,
                            });

                        })
                        if (new_dfc) {
                            res.json({
                                success: true,
                                message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                            })
                        }
                    }).catch(e => {
                        return res.json({
                            success: false,
                            message: "An error occured, could not create Appointment type other"
                                //message: e.message
                        })
                    })
                }
                let dfc_create = {}
                dfc_create.client_id = check_client.id
                dfc_create.duration_more = 'Unstable'
                dfc_create.created_by = check_user.id
                dfc_create.appointment_id = app.id

                let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message,
                    });

                })
                if (new_dfc) {
                    res.json({
                        success: true,
                        message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                    })
                }
            }).catch(e => {
                return res.json({
                    success: false,
                    message: 'An error occured, could not create Appointment'
                        //message: e.message
                })
            })
        }
    }


})

router.post('/client/not/dcm', async(req, res) => {
        let phone_no = req.body.phone_no
        let clinic_number = req.body.clinic_number
        let appointment_date = req.body.appointment_date
        let appointment_type = req.body.appointment_type
        let appointment_other = req.body.appointment_other
        let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

        let check_client = await Client.findOne({
            where: {
                clinic_number
            }
        })
        if (!check_client)
            return res.json({
                success: false,
                message: `Clinic number ${clinic_number} does not exist in the system`

            })
        let check_user = await User.findOne({
            where: {
                phone_no
            }
        })
        if (!check_user)
            return res.json({
                success: false,
                message: `Phone number ${phone_no} does not exist in the system`
            })

        let get_facility = await masterFacility.findOne({
            where: {
                code: check_client.mfl_code
            },
            attributes: ["code", "name"],
        })
        if (!get_facility)
            return res.json({
                success: false,
                message: `Clinic number ${clinic_number} is not assigned to a facility`
            })

        let get_clinic = await Clinic.findOne({
            where: {
                id: check_client.clinic_id
            },
            attributes: ["id", "name"],
        })
        if (!get_clinic)
            return res.json({
                success: false,
                message: `Clinic number ${clinic_number} is not assigned to a clinic`
            })

        let get_user_clinic = await Clinic.findOne({
            where: {
                id: check_user.clinic_id
            },
            attributes: ["id", "name"],
        })
        if (!get_user_clinic)
            return res.json({
                success: false,
                message: `Phone number: ${phone_no} is not assigned to a clinic`
            })

        if (check_client.mfl_code != check_user.facility_id)
            return res.json({
                success: false,
                message: `Client ${clinic_number} is not mapped to your facility, the client is mapped to ${get_facility.name}`
            })
        if (check_client.clinic_id != check_user.clinic_id)
            return res.json({
                success: false,
                message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`

            })

        if (check_client.status != "Active")
            return res.json({
                success: false,
                message: `Client: ${clinic_number} is not active in the system.`
            })
        if (check_user.status != "Active")
            return res.json({
                success: false,
                message: `Phone number: ${phone_no} is not active in the system.`
            })

        let existing_appointment = await Appointment.count({
            where: {
                client_id: check_client.id
            }
        })

        if (existing_appointment === 0) {
            return Appointment.create({
                app_status: "Booked",
                appntmnt_date: appointment_date,
                status: "Active",
                sent_flag: '1',
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: appointment_type,
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }).then((app) => {
                if (appointment_type == '6') {
                    return OtherAppointmentType.create({
                        name: appointment_other,
                        created_by: check_user.id,
                        created_at: today,
                        appointment_id: app.id

                    }).then((other_app) => {
                        let dfc_create = {}
                        dfc_create.client_id = check_client.id
                        dfc_create.duration_more = 'Stable'
                        dfc_create.stability_status = 'NotDCM'
                        dfc_create.created_by = check_user.id
                        dfc_create.appointment_id = app.id

                        let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                            res.json({
                                success: false,
                                message: e.message,
                            });

                        })
                        if (new_dfc) {
                            res.json({
                                success: true,
                                message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                            })
                        }
                    }).catch(e => {
                        return res.json({
                            success: false,
                            message: "An error occured, could not create Appointment type other"
                        })
                    })
                }
                let dfc_create = {}
                dfc_create.client_id = check_client.id
                dfc_create.duration_more = 'Stable'
                dfc_create.stability_status = 'NotDCM'
                dfc_create.created_by = check_user.id
                dfc_create.appointment_id = app.id

                let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message,
                    });

                })
                if (new_dfc) {
                    res.json({
                        success: true,
                        message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                    })
                }

            }).catch(e => {
                return res.json({
                    success: false,
                    message: "An error occured, could not create Appointment"
                })
            })

        } else {
            //appointment history available
            let active_appointment = await Appointment.count({
                where: {
                    client_id: check_client.id,
                    active_app: '1'
                }
            })
            if (active_appointment) {
                //check if date of app is less than curr date
                let active_appointment = await Appointment.findOne({
                    where: {
                        client_id: check_client.id,
                        active_app: '1'
                    }
                })
                if (active_appointment) {
                    if (moment(active_appointment.appntmnt_date).isBefore(
                            new Date().toDateString()
                        )) {
                        return Appointment.update({
                            sent_flag: '1',
                        }, {
                            where: {
                                id: active_appointment.id
                            }
                        }).then(([updated, old_app]) => {
                            if (updated) {
                                return res.json({
                                    success: false,
                                    message: `Client ${clinic_number} missed an appointment on date ${active_appointment.appntmnt_date}. Kindly update then from the defaulter diary`,
                                    status: 'Defaulter'
                                })

                            }
                        })

                        //check if date is same as curr date
                    } else if (moment(active_appointment.appntmnt_date).isSame(
                            new Date().toDateString()
                        )) {
                        return Appointment.update({
                            sent_flag: '1',
                        }, {
                            where: {
                                id: active_appointment.id
                            }
                        }).then(([updated, old_app]) => {
                            if (updated) {
                                return res.json({
                                    success: false,
                                    message: `Client ${clinic_number} has an active appointment today. Kindly update them from today's appointment`,
                                    status: 'Appointment'
                                })

                            }
                        })

                    } else if (moment(active_appointment.appntmnt_date).isSame(appointment_date)) {
                        return Appointment.update({
                            sent_flag: '1',
                        }, {
                            where: {
                                id: active_appointment.id
                            }
                        }).then(([updated, old_app]) => {
                            if (updated) {
                                return res.json({
                                    success: false,
                                    message: `Client ${clinic_number} already has an appointment on ${appointment_date} and cannot be booked again`
                                })

                            }
                        })

                    } else {
                        //mark as unscheduled
                        return Appointment.update({
                            appointment_kept: "Yes",
                            date_attended: today,
                            active_app: "0",
                            updated_at: today,
                            unscheduled_date: today,
                            updated_by: check_user.id,
                            app_status: "Notified",
                            visit_type: "Un-Scheduled"
                        }, {
                            where: {
                                id: active_appointment.id
                            }
                        }).then(([updated, old_app]) => {
                            if (updated) {
                                //schedule a new one
                                return Appointment.create({
                                    app_status: "Booked",
                                    appntmnt_date: appointment_date,
                                    status: "Active",
                                    sent_flag: '1',
                                    sent_status: "Sent",
                                    client_id: check_client.id,
                                    created_at: today,
                                    created_by: check_user.id,
                                    app_type_1: appointment_type,
                                    entry_point: "Mobile",
                                    visit_type: "Scheduled",
                                    active_app: "1"
                                }).then((new_app) => {
                                    if (appointment_type == '6') {
                                        return OtherAppointmentType.create({
                                            name: appointment_other,
                                            created_by: check_user.id,
                                            created_at: today,
                                            appointment_id: new_app.id
                                        }).then((other_n_app) => {
                                            let dfc_create_new = {}
                                            dfc_create_new.client_id = check_client.id
                                            dfc_create_new.duration_more = 'Stable'
                                            dfc_create_new.stability_status = 'NotDCM'
                                            dfc_create_new.created_by = check_user.id
                                            dfc_create_new.appointment_id = new_app.id

                                            let dfc_create_other = DFCModulue.create(dfc_create_new).catch((e) => {
                                                res.json({
                                                    success: false,
                                                    message: e.message,
                                                })

                                            })
                                            if (dfc_create_other) {
                                                res.json({
                                                    success: true,
                                                    message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                                })
                                            }

                                        }).catch(e => {
                                            return res.json({
                                                success: false,
                                                message: "An error occured, could not create Appointment type other"
                                                    //message: e.message
                                            })
                                        })

                                    }
                                    let dfc_create_new = {}
                                    dfc_create_new.client_id = check_client.id
                                    dfc_create_new.duration_more = 'Stable'
                                    dfc_create_new.stability_status = 'NotDCM'
                                    dfc_create_new.created_by = check_user.id
                                    dfc_create_new.appointment_id = new_app.id

                                    let new_dfc = DFCModulue.create(dfc_create_new).catch((e) => {
                                        res.json({
                                            success: false,
                                            message: e.message,
                                        });

                                    })
                                    if (new_dfc) {
                                        res.json({
                                            success: true,
                                            message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                        })
                                    }
                                }).catch(e => {
                                    return res.json({
                                        success: false,
                                        message: 'An error occured, could not create Appointment'
                                    })
                                })

                            }
                        })
                    }
                }
            } else {
                return Appointment.create({
                    app_status: "Booked",
                    appntmnt_date: appointment_date,
                    status: "Active",
                    sent_flag: '1',
                    sent_status: "Sent",
                    client_id: check_client.id,
                    created_at: today,
                    created_by: check_user.id,
                    app_type_1: appointment_type,
                    entry_point: "Mobile",
                    visit_type: "Scheduled",
                    active_app: "1"
                }).then((app) => {
                    if (appointment_type == '6') {
                        return OtherAppointmentType.create({
                            name: appointment_other,
                            created_by: check_user.id,
                            created_at: today,
                            appointment_id: app.id

                        }).then((other_app) => {
                            let dfc_create = {}
                            dfc_create.client_id = check_client.id
                                //dfc_create.date_created = moment(new Date()).format("YYYY-MM-DD H:m:s")
                            dfc_create.duration_more = 'Stable'
                            dfc_create.stability_status = 'NotDCM'
                            dfc_create.created_by = check_user.id
                            dfc_create.appointment_id = app.id

                            let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                                res.json({
                                    success: false,
                                    message: e.message,
                                });

                            })
                            if (new_dfc) {
                                res.json({
                                    success: true,
                                    message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                })
                            }
                        }).catch(e => {
                            return res.json({
                                success: false,
                                message: "An error occured, could not create Appointment type other"
                                    //message: e.message
                            })
                        })
                    }
                    let dfc_create = {}
                    dfc_create.client_id = check_client.id
                    dfc_create.duration_more = 'Stable'
                    dfc_create.stability_status = 'NotDCM'
                    dfc_create.created_by = check_user.id
                    dfc_create.appointment_id = app.id

                    let new_dfc = DFCModulue.create(dfc_create).catch((e) => {
                        res.json({
                            success: false,
                            message: e.message,
                        });

                    })
                    if (new_dfc) {
                        res.json({
                            success: true,
                            message: `Appointment for ${check_client.f_name} UPN:  ${clinic_number} on ${appointment_date} was created successfully`
                                //message: e.message
                        })
                    }
                }).catch(e => {
                    return res.json({
                        success: false,
                        message: 'An error occured, could not create Appointment'
                            //message: e.message
                    })
                })
            }
        }
    })
    //on DCM process
router.post('/client/dcm/create', async(req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number
    let refill_date = req.body.refill_date
    let review_date = req.body.review_date
    let facility_based = req.body.facility
    let community_based = req.body.community
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

    let check_client = await Client.findOne({
        where: {
            clinic_number
        }
    })
    if (!check_client)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} does not exist in the system`

        })

    let check_user = await User.findOne({
        where: {
            phone_no
        }
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })

    let get_facility = await masterFacility.findOne({
        where: {
            code: check_client.mfl_code
        },
        attributes: ["code", "name"],
    })
    if (!get_facility)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a facility`
        })

    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_clinic)
        return res.json({
            success: false,
            message: `Clinic number ${clinic_number} is not assigned to a clinic`
        })


    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (!get_user_clinic)
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not assigned to a clinic`
        })

    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your facility, the client is mapped to ${get_facility.name}`
        })

    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`

        })

    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })
    if (check_user.status != "Active")
        return res.json({
            success: false,
            message: `Phone number: ${phone_no} is not active in the system.`
        })
    let existing_appointment = await Appointment.count({
        where: {
            client_id: check_client.id
        }
    })
    if (existing_appointment === 0) {
        if (refill_date != '-1' && review_date != '-1') {
            return Appointment.bulkCreate([{
                app_status: 'Booked',
                appntmnt_date: refill_date,
                status: "Active",
                sent_flag: '1',
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: '1',
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }, {
                app_status: 'Booked',
                appntmnt_date: review_date,
                status: "Active",
                sent_flag: '1',
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: '2',
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }], {
                individualHooks: true
            }).then((two_app) => {
                let dcm_client = {}
                dcm_client.client_id = check_client.id
                dcm_client.duration_more = 'Stable'
                dcm_client.stability_status = 'DCM'
                dcm_client.facility_based = facility_based != '-1' ? facility_based : null
                dcm_client.community_based = community_based != '-1' ? community_based : null
                dcm_client.refill_date = refill_date
                dcm_client.clinical_visit_date = review_date
                dcm_client.created_by = check_user.id
                dcm_client.appointment_id = two_app[0].id
                dcm_client.appointment_id_two = two_app[1].id

                let new_dfc = DFCModulue.create(dcm_client).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message,
                    });

                })
                if (new_dfc) {
                    res.json({
                        success: true,
                        message: `The Differentiated Service Module Appointment for client: ${check_client.f_name}, UPN:  ${clinic_number} on ${refill_date} for Refill visit and ${review_date} for Review Date was created successfully`
                    })
                }
            }).catch(e => {
                return res.json({
                    success: false,
                    message: 'An error occured, could not create Appointment'
                })
            })

        } else {
            return Appointment.create({
                app_status: "Booked",
                appntmnt_date: refill_date != '-1' ? refill_date : review_date,
                status: "Active",
                sent_flag: '1',
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: refill_date != '-1' ? '1' : '2',
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }, {
                individualHooks: true
            }).then((app) => {
                let dcm_client = {}
                dcm_client.client_id = check_client.id
                dcm_client.duration_more = 'Stable'
                dcm_client.stability_status = 'DCM'
                dcm_client.facility_based = facility_based != '-1' ? facility_based : null
                dcm_client.community_based = community_based != '-1' ? community_based : null
                dcm_client.refill_date = refill_date != '-1' ? refill_date : null
                dcm_client.clinical_visit_date = review_date != '-1' ? review_date : null
                dcm_client.created_by = check_user.id
                dcm_client.appointment_id = app.id

                let new_dfc = DFCModulue.create(dcm_client).catch((e) => {
                    res.json({
                        success: false,
                        message: e.message,
                    });
                })
                if (new_dfc) {
                    res.json({
                        success: true,
                        message: `The Differentiated Service Module Appointment for client: ${check_client.f_name}, UPN:  ${clinic_number} on ${app.appntmnt_date} was created successfully`
                    })
                }
            }).catch(e => {
                return res.json({
                    success: false,
                    message: 'An error occured, could not create Appointment'
                })
            })
        }
    } else {
        //appointment history exists
        let get_active_app = await Appointment.count({
            where: {
                client_id: check_client.id,
                active_app: '1'
            }
        })
        if (get_active_app > 0) {
            let get_client_apps = await Appointment.findAll({
                where: {
                    client_id: check_client.id,
                    active_app: '1'
                }
            })
            const less_that_today = get_client_apps.filter(get_client => moment(get_client.appntmnt_date).isBefore(today))
            const same_as_today = get_client_apps.filter(get_client => moment(get_client.appntmnt_date).isSame(today))
            const future_date_exists = get_client_apps.filter(get_client => moment(get_client.appntmnt_date).isAfter(today))

            if (less_that_today.length > 1) {
                let ids = [less_that_today[0].id, less_that_today[1].id]
                return Appointment.update({
                    sent_flag: '1',
                }, {
                    where: {
                        id: ids
                    }
                }).then(([updated, old_app]) => {
                    if (updated) {
                        res.json({
                            success: false,
                            message: `DCM Client ${check_client.clinic_number} missed two appointments on ${less_that_today[0].appntmnt_date} and on ${less_that_today[1].appntmnt_date}. Kindly update the client from the defaulter diary`,
                            status: 'Defaulter'
                        })

                    }
                })

            } else
            if (less_that_today.length == 1) {
                return Appointment.update({
                    sent_flag: '1',
                }, {
                    where: {
                        id: less_that_today[0].id
                    }
                }).then(([updated, old_app]) => {
                    if (updated) {
                        res.json({
                            success: false,
                            message: `DCM Client ${check_client.clinic_number} missed an appointment on ${less_that_today[0].appntmnt_date}. Kindly update the client from the defaulter diary`,
                            status: 'Defaulter'
                        })

                    }
                })

            } else {}
            if (same_as_today.length > 0) {
                return Appointment.update({
                    sent_flag: '1',
                }, {
                    where: {
                        id: same_as_today[0].id
                    }
                }).then(([updated, old_app]) => {
                    if (updated) {
                        res.json({
                            success: false,
                            message: `DCM Client ${check_client.clinic_number} has an appointment today: ${same_as_today[0].appntmnt_date}. Kindly confirm them from the appointment diary`,
                            status: 'Appointment'
                        })

                    }
                })

            }
            if (future_date_exists.length > 1) {
                let ids = [future_date_exists[0].id, future_date_exists[1].id]
                return Appointment.update({
                    sent_flag: '1',
                }, {
                    where: {
                        id: ids
                    }
                }).then(([updated, old_app]) => {
                    if (updated) {
                        res.json({
                            success: false,
                            message: `Client ${check_client.clinic_number} under Differentiated Serive Module has appointments scheduled for ${future_date_exists[0].appntmnt_date} and ${future_date_exists[1].appntmnt_date}. Kindly proceed to the appointment diary to book the client as an Un-Scheduled`,
                            status: 'Appointment'
                        })

                    }
                })

            } else {
                return Appointment.update({
                    sent_flag: '1',
                }, {
                    where: {
                        id: future_date_exists[0].id
                    }
                }).then(([updated, old_app]) => {
                    if (updated) {
                        res.json({
                            success: false,
                            message: `Client ${check_client.clinic_number} under Differentiated Serive Module has an appointment scheduled for ${future_date_exists[0].appntmnt_date}. Kindly proceed to the appointment diary to book the client as an Un-Scheduled`,
                            status: 'Appointment'
                        })

                    }
                })

            }
        } else if (get_active_app === 0) {
            if (refill_date != '-1' && review_date != '-1') {
                return Appointment.bulkCreate([{
                    app_status: 'Booked',
                    appntmnt_date: refill_date,
                    status: "Active",
                    sent_flag: '1',
                    sent_status: "Sent",
                    client_id: check_client.id,
                    created_at: today,
                    created_by: check_user.id,
                    app_type_1: '1',
                    entry_point: "Mobile",
                    visit_type: "Scheduled",
                    active_app: "1"
                }, {
                    app_status: 'Booked',
                    appntmnt_date: review_date,
                    status: "Active",
                    sent_flag: '1',
                    sent_status: "Sent",
                    client_id: check_client.id,
                    created_at: today,
                    created_by: check_user.id,
                    app_type_1: '2',
                    entry_point: "Mobile",
                    visit_type: "Scheduled",
                    active_app: "1"
                }], {
                    individualHooks: true
                }).then((two_app) => {
                    let dcm_client = {}
                    dcm_client.client_id = check_client.id
                    dcm_client.duration_more = 'Stable'
                    dcm_client.stability_status = 'DCM'
                    dcm_client.facility_based = facility_based != '-1' ? facility_based : null
                    dcm_client.community_based = community_based != '-1' ? community_based : null
                    dcm_client.refill_date = refill_date
                    dcm_client.clinical_visit_date = review_date
                    dcm_client.created_by = check_user.id
                    dcm_client.appointment_id = two_app[0].id
                    dcm_client.appointment_id_two = two_app[1].id

                    let new_dfc = DFCModulue.create(dcm_client).catch((e) => {
                        res.json({
                            success: false,
                            message: e.message,
                        });

                    })
                    if (new_dfc) {
                        res.json({
                            success: true,
                            message: `The Differentiated Service Module Appointment for client, ${check_client.f_name}, UPN:  ${clinic_number} on ${refill_date} for Refill visit and ${review_date} for Review Date was created successfully`
                        })
                    }
                }).catch(e => {
                    return res.json({
                        success: false,
                        message: 'An error occured, could not create Appointment'
                    })
                })

            } else {
                return Appointment.create({
                    app_status: "Booked",
                    appntmnt_date: refill_date != '-1' ? refill_date : review_date,
                    status: "Active",
                    sent_flag: '1',
                    sent_status: "Sent",
                    client_id: check_client.id,
                    created_at: today,
                    created_by: check_user.id,
                    app_type_1: refill_date != '-1' ? '1' : '2',
                    entry_point: "Mobile",
                    visit_type: "Scheduled",
                    active_app: "1"
                }, {
                    individualHooks: true
                }).then((app) => {
                    let dcm_client = {}
                    dcm_client.client_id = check_client.id
                    dcm_client.duration_more = 'Stable'
                    dcm_client.stability_status = 'DCM'
                    dcm_client.facility_based = facility_based != '-1' ? facility_based : null
                    dcm_client.community_based = community_based != '-1' ? community_based : null
                    dcm_client.refill_date = refill_date != '-1' ? refill_date : null
                    dcm_client.clinical_visit_date = review_date != '-1' ? review_date : null
                    dcm_client.created_by = check_user.id
                    dcm_client.appointment_id = app.id

                    let new_dfc = DFCModulue.create(dcm_client).catch((e) => {
                        res.json({
                            success: false,
                            message: e.message,
                        });
                    })
                    if (new_dfc) {
                        res.json({
                            success: true,
                            message: `The Differentiated Service Module Appointment for client: ${check_client.f_name}, UPN:  ${clinic_number} on ${app.appntmnt_date} was created successfully`
                        })
                    }
                }).catch(e => {
                    return res.json({
                        success: false,
                        message: 'An error occured, could not create Appointment'
                    })
                })
            }
        } else {
            console.log('check for errors...')
        }
    }
})






module.exports = router;