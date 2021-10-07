const express = require("express");
const moment = require("moment");
const _ = require("lodash");
const Op = require("sequelize").Op;
const router = express.Router();
const {
    date,
    raw
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
    PMTCTModule
} = require("../../models/pmtct_module");
const {
    Clinic
} = require("../../models/clinic");
const {
    Language
} = require("../../models/language");
const {
    masterFacility
} = require('../../models/master_facility');
const {
    OtherAppointmentType
} = require("../../models/other_appointment_types");
const {
    create
} = require("lodash");
const e = require("express");
const {
    CareGiver
} = require("../../models/care_giver");
moment.createFromInputFallback = function (config) {
    config._d = new Date(config._i);
};

router.post('/check/pmtct/clinic', async (req, res) => {
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
    let get_clinic = await Clinic.findOne({
        where: {
            id: client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
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
    if (get_clinic.id == '2') {
        res.json({
            success: true,
            message: get_clinic.name
        })
    } else {
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not mapped to PMTCT, the client is mapped to ${get_clinic.name}. Please do a move clinic on the last icon in the appointment diary`
        })
    }

})
router.post('/register/non/breastfeeding', async (req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number

    let check_client = await Client.findOne({
        where: {
            clinic_number
        }
    })
    // check client gender
    let client_male = await Client.findOne({
        where: {
            clinic_number,
            gender: 2
        }
    })
    if (client_male)
        return res.json({
            success: false,
            message: `Client with clinic number ${clinic_number} is Male. Cannot be registered as pregnant on PMTCT module`
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
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (get_clinic.id != 2)
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not mapped to PMTCT, the client is mapped to ${get_clinic.name}. Please do a move clinic on the last icon in the appointment diary`
        })

    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
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
    let check_exists = await PMTCTModule.findOne({
        where: {
            [Op.or]: [{
                client_id: check_client.id,
                type_of_care: "No",
            },
                {
                    client_id: check_client.id,
                    type_of_care: "Yes",
                },
                {
                    client_id: check_client.id,
                    type_of_care: "Pregnant"
                },
            ],
        },
    })
    if (!check_exists) {
        let pmtct_create = {}
        pmtct_create.client_id = check_client.id
        pmtct_create.type_of_care = 'Pregnant'
        pmtct_create.created_by = check_user.id

        let new_pmtct = PMTCTModule.create(pmtct_create).catch((e) => {
            return {
                success: false,
                message: e.message
            }
        })
        if (new_pmtct) {
            return res.json({
                success: true,
                message: `Client ${check_client.f_name} UPN: ${clinic_number} was created successfully in the PMTCT Module`

            })
        }

    } else {
        return res.json({
            success: false,
            message: `Client ${check_client.f_name} UPN: ${clinic_number} already exists in the system`
        })
    }
})
router.post('/register/hei/client', async (req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number
    let hei_no = req.body.hei_no
    hei_gender = req.body.hei_gender
    hei_dob = req.body.hei_dob
    hei_first_name = req.body.hei_first_name
    hei_middle_name = req.body.hei_middle_name
    hei_last_name = req.body.hei_last_name
    breastfeeding = req.body.breastfeeding
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")
    let check_client = await Client.findOne({
        where: {
            clinic_number
        },
        raw: true
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
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })

    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
        })
    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (get_clinic.id != 2)
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not mapped to PMTCT, the client is mapped to ${get_clinic.name}. Please do a move clinic on the last icon in the appointment diary`
        })
    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })

    if (moment(hei_dob).format('YYYY-MM-DD') > moment(today).format('YYYY-MM-DD'))
        return res.json({
            success: false,
            message: 'HEI Date of birth cannot be greater than today'
        })

    if (hei_dob < check_client.dob)
        return res.json({
            success: false,
            message: "HEI Date of birth cannot be greater than the mother's date of birth"
        })


    let pcr6wks = moment(hei_dob, "YYYY-MM-DD").add(42, 'days')
    let pcr6months = moment(hei_dob, 'YYYY-MM-DD').add(6, 'months')
    let pcr12months = moment(hei_dob, 'YYYY-MM-DD').add(12, 'months')
    let pmtct_create = {}
    pmtct_create.client_id = check_client.id
    pmtct_create.hei_no = hei_no
    pmtct_create.type_of_care = breastfeeding == 1 ? 'Yes' : 'No'
    pmtct_create.hei_gender = hei_gender
    pmtct_create.hei_dob = hei_dob
    pmtct_create.hei_first_name = hei_first_name
    pmtct_create.hei_middle_name = hei_middle_name
    pmtct_create.hei_last_name = hei_last_name
    pmtct_create.pcr_week6 = pcr6wks
    pmtct_create.pcr_month6 = pcr6months
    pmtct_create.pcr_month12 = pcr12months
    pmtct_create.created_by = check_user.id

    const [client, created] = await PMTCTModule.findOrCreate({
        where: {
            hei_no: pmtct_create.hei_no
        },
        defaults: pmtct_create,
    })
    if (created) {
        let mom_count = await PMTCTModule.count({
            where: {
                [Op.or]: [{
                    client_id: check_client.id,
                    type_of_care: 'Yes'
                },
                    {
                        client_id: check_client.id,
                        type_of_care: 'No'
                    },
                ],

            },
        })
        let hei_ccc = `${check_client.clinic_number}-${mom_count}`
        let {
            id,
            f_name,
            m_name,
            l_name,
            gender,
            clinic_number,
            dob,
            enrollment_date,
            art_date,
            clnd_dob,
            hei_no,
            client_status,
            marital,
            client_type,
            prev_clinic,
            transfer_date,
            file_no,
            clinic_id,
            ...newObj
        } = check_client


        let hei_client_obj = {
            group_id: '3',
            clinic_number: hei_ccc,
            f_name: hei_first_name,
            m_name: hei_middle_name,
            l_name: hei_last_name,
            gender: hei_gender,
            hei_no: pmtct_create.hei_no,
            dob: hei_dob,
            client_status: 'No Condition',
            client_type: 'New',
            clinic_id: '2'
        }
        hei_client_obj = {
            ...hei_client_obj,
            ...newObj
        }
        let save_hei_client = await Client.findOrCreate({
            where: {
                clinic_number: hei_client_obj.clinic_number,
                hei_no: hei_client_obj.hei_no
            },
            defaults: hei_client_obj
        })
        if (save_hei_client) {
            res.json({
                success: true,
                message: `HEI number ${pmtct_create.hei_no} has been created successfully in the system `
            })
        }
    } else {
        res.json({
            success: false,
            message: `HEI number ${pmtct_create.hei_no} already exists in the system`
        })
    }


})
router.post('/check/attached/heis', async (req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number

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
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
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
    let attached_heis = await PMTCTModule.findAll({
        where: {
            client_id: check_client.id
        },
        attributes: ['hei_no', 'hei_dob', 'hei_first_name', 'hei_middle_name', 'hei_last_name', 'pcr_week6']
    })
    let all_heis = []
    for (heis of attached_heis) {
        if (heis.hei_no) {
            let data = {}
            data.hei_no = heis.hei_no
            data.hei_dob = heis.hei_dob
            data.hei_first_name = heis.hei_first_name
            data.hei_middle_name = heis.hei_middle_name
            data.hei_last_name = heis.hei_last_name
            data.pcr_week6 = heis.pcr_week6
            all_heis.push(data)
        } else {}
    }
    if (all_heis.length > 0) {
        res.json({
            success: true,
            message: all_heis
        })
    } else {
        res.json({
            success: false,
            message: 'The client has no HEIs attached'
        })
    }

})
router.post('/book/client/appointment', async (req, res) => {
    let phone_no = req.body.phone_no
    let clinic_number = req.body.clinic_number
    let appointment_date = req.body.appointment_date
    let appointment_type = req.body.appointment_type
    let appointment_other = req.body.appointment_other
    let hei_number = req.body.hei_number
    let pcr_taken = req.body.pcr_taken
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
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name}`
        })
    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (get_clinic.id != 2)
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not mapped to PMTCT, the client is mapped to ${get_clinic.name}. Please do a move clinic on the last icon in the appointment diary`
        })
    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system.`
        })
    let existing_appointment = await Appointment.count({
        where: {
            client_id: check_client.id
        }
    })
    if (existing_appointment === 0) {
        let hei_pcr6weeks = await PMTCTModule.findOne({
            where: {
                hei_no: hei_number
            },
            raw: true
        })
        let past_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').subtract(7, 'days').format('YYYY-MM-DD')
        let next_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').add(7, 'days').format('YYYY-MM-DD')
        let day = moment(today).diff(hei_pcr6weeks.hei_dob, "days")
        console.log(day)
        if (day < 56) {
            if (pcr_taken == 'NO') {
                if (!moment(appointment_date).isBetween(past_week, next_week))
                    return res.json({
                        success: false,
                        message: `The appointment date you selected ${appointment_date} is past the range required for Week 6 PCR: ${hei_pcr6weeks.pcr_week6}. Please select a date between ${past_week} and ${next_week}`
                    })

            }
        }
        return Appointment.create({
            app_status: 'Booked',
            appntmnt_date: appointment_date,
            status: "Active",
            sent_status: "Sent",
            client_id: check_client.id,
            created_at: today,
            created_by: check_user.id,
            app_type_1: appointment_type,
            entry_point: "Mobile",
            visit_type: "Scheduled",
            active_app: "1"
        }, {
            individualHooks: true,
        }).then((app) => {
            if (appointment_type == '6') {
                return OtherAppointmentType.create({
                    name: appointment_other,
                    created_by: check_user.id,
                    created_at: today,
                    appointment_id: app.id

                }).then((other_app) => {
                    let pmtct_entry = {}
                    pmtct_entry.client_id = check_client.id
                    pmtct_entry.appointment_date = appointment_date
                    pmtct_entry.created_by = check_user.id
                    pmtct_entry.appointment_id = app.id

                    let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                        return {
                            success: false,
                            message: e.message
                        }
                    })
                    if (new_pmtct) {
                        return res.json({
                            success: true,
                            message: `Appointment for ${check_client.f_name} UPN: ${clinic_number} on ${appointment_date} was created successfully`

                        })
                    }

                }).catch(e => {
                    return res.json({
                        success: false,
                        message: 'An error occured, could not create Appointment type other'
                    })
                })
            }
            let pmtct_entry = {}
            pmtct_entry.client_id = check_client.id
            pmtct_entry.appointment_date = appointment_date
            pmtct_entry.created_by = check_user.id
            pmtct_entry.appointment_id = app.id


            let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                return {
                    success: false,
                    message: e.message
                }
            })
            if (new_pmtct) {
                return res.json({
                    success: true,
                    message: `Appointment for ${check_client.f_name} UPN: ${clinic_number} on ${appointment_date} was created successfully`

                })
            } else {
                console.log(e.message)
            }
        }).catch(e => {
            return res.json({
                success: false,
                message: 'An error occured, could not create Appointment'

            })
        })
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
            if (less_that_today.length > 0) {
                res.json({
                    success: false,
                    message: `Client ${check_client.clinic_number} missed an appointment on ${less_that_today[0].appntmnt_date}. Kindly update the client from the defaulter diary`
                })
            }
            if (same_as_today.length > 0) {
                res.json({
                    success: false,
                    message: `Client ${check_client.clinic_number} has an active appointment today. Kindly update them from the appointment diary`
                })
            }
            if (future_date_exists.length > 0) {
                res.json({
                    success: false,
                    message: `Client ${check_client.clinic_number} has an appointment scheduled for ${future_date_exists[0].appntmnt_date}. Kindly proceed to the appointment diary to book the client as an Un-Scheduled.`
                })
            }
        } else if (get_active_app === 0) {
            let hei_pcr6weeks = await PMTCTModule.findOne({
                where: {
                    hei_no: hei_number
                },
                raw: true
            })
            let past_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').subtract(7, 'days').format('YYYY-MM-DD')
            let next_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').add(7, 'days').format('YYYY-MM-DD')
            let day = moment(today).diff(hei_pcr6weeks.hei_dob, "days")
            console.log(day)
            if (day < 56) {
                if (pcr_taken == 'NO') {
                    if (!moment(appointment_date).isBetween(past_week, next_week))
                        return res.json({
                            success: false,
                            message: `The appointment date you selected ${appointment_date} is past the range required for Week 6 PCR: ${hei_pcr6weeks.pcr_week6}. Please select a date between ${past_week} and ${next_week}`
                        })

                }

            }
            return Appointment.create({
                app_status: 'Booked',
                appntmnt_date: appointment_date,
                status: "Active",
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: appointment_type,
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }, {
                individualHooks: true,
            }).then((app) => {
                if (appointment_type == '6') {
                    return OtherAppointmentType.create({
                        name: appointment_other,
                        created_by: check_user.id,
                        created_at: today,
                        appointment_id: app.id

                    }).then((other_app) => {
                        let pmtct_entry = {}
                        pmtct_entry.client_id = check_client.id
                        pmtct_entry.appointment_date = appointment_date
                        pmtct_entry.created_by = check_user.id
                        pmtct_entry.appointment_id = app.id

                        let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                            return {
                                success: false,
                                message: e.message
                            }
                        })
                        if (new_pmtct) {
                            return res.json({
                                success: true,
                                message: `Appointment for ${check_client.f_name} UPN: ${clinic_number} on ${appointment_date} was created successfully`

                            })
                        }

                    }).catch(e => {
                        return res.json({
                            success: false,
                            message: 'An error occured, could not create Appointment type other'
                        })
                    })
                }
                let pmtct_entry = {}
                pmtct_entry.client_id = check_client.id
                pmtct_entry.appointment_date = appointment_date
                pmtct_entry.created_by = check_user.id
                pmtct_entry.appointment_id = app.id

                let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                    return {
                        success: false,
                        message: e.message
                    }
                })
                if (new_pmtct) {
                    return res.json({
                        success: true,
                        message: `Appointment for ${check_client.f_name} UPN: ${clinic_number} on ${appointment_date} was created successfully`

                    })
                } else {
                    console.log(e.message)
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
router.post('/book/hei/appointment', async (req, res) => {
    let phone_no = req.body.phone_no
    let hei_number = req.body.hei_number
    let appointment_date = req.body.appointment_date
    let appointment_type = req.body.appointment_type
    let appointment_other = req.body.appointment_other
    let pcr_taken = req.body.pcr_taken
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

    let check_client = await Client.findOne({
        where: {
            hei_no: hei_number
        }
    })
    if (!check_client)
        return res.json({
            success: false,
            message: `HEI number ${hei_number} does not exist in the system`
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
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} does not belong in your facility, the child is mapped to ${get_facility.name}`
        })
    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} is not mapped to your clinic, the child is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (get_clinic.id != 2)
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} is not mapped to PMTCT, the child is mapped to ${get_clinic.name}.`
        })
    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} is not active in the system.`
        })
    let existing_appointment = await Appointment.count({
        where: {
            client_id: check_client.id
        }
    })
    if (existing_appointment === 0) {
        let hei_pcr6weeks = await PMTCTModule.findOne({
            where: {
                hei_no: hei_number
            },
            raw: true
        })
        let past_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').subtract(7, 'days').format('YYYY-MM-DD')
        let next_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').add(7, 'days').format('YYYY-MM-DD')
        let day = moment(today).diff(hei_pcr6weeks.hei_dob, "days")
        if (day < 56) {
            if (pcr_taken == 'NO') {
                if (!moment(appointment_date).isBetween(past_week, next_week))
                    return res.json({
                        success: false,
                        message: `The appointment date you selected ${appointment_date} is past the range required for Week 6 PCR: ${hei_pcr6weeks.pcr_week6}. Please select a date between ${past_week} and ${next_week}`
                    })

            }

        }

        return Appointment.create({
            app_status: 'Booked',
            appntmnt_date: appointment_date,
            status: "Active",
            sent_status: "Sent",
            client_id: check_client.id,
            created_at: today,
            created_by: check_user.id,
            app_type_1: appointment_type,
            entry_point: "Mobile",
            visit_type: "Scheduled",
            active_app: "1"
        }, {
            individualHooks: true,
        }).then((app) => {
            if (appointment_type == '6') {
                return OtherAppointmentType.create({
                    name: appointment_other,
                    created_by: check_user.id,
                    created_at: today,
                    appointment_id: app.id

                }).then((other_app) => {
                    let pmtct_entry = {}
                    pmtct_entry.client_id = check_client.id
                    pmtct_entry.appointment_date = appointment_date
                    pmtct_entry.created_by = check_user.id
                    pmtct_entry.appointment_id = app.id

                    let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                        return {
                            success: false,
                            message: e.message
                        }
                    })
                    if (new_pmtct) {
                        return res.json({
                            success: true,
                            message: `Appointment for ${check_client.f_name} HEI Number: ${hei_number} on ${appointment_date} was created successfully`

                        })
                    }

                }).catch(e => {
                    return res.json({
                        success: false,
                        message: 'An error occured, could not create Appointment type other'
                    })
                })
            }
            let pmtct_entry = {}
            pmtct_entry.client_id = check_client.id
            pmtct_entry.appointment_date = appointment_date
            pmtct_entry.created_by = check_user.id
            pmtct_entry.appointment_id = app.id


            let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                return {
                    success: false,
                    message: e.message
                }
            })
            if (new_pmtct) {
                return res.json({
                    success: true,
                    message: `Appointment for ${check_client.f_name} HEI number: ${hei_number} on ${appointment_date} was created successfully`

                })
            } else {
                console.log(e.message)
            }

        }).catch(e => {
            return res.json({
                success: false,
                message: 'An error occured, could not create Appointment'

            })
        })

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
            if (less_that_today.length > 0) {
                res.json({
                    success: false,
                    message: `Child with HEI number: ${check_client.hei_no} missed an appointment on ${less_that_today[0].appntmnt_date}. Kindly update the child from the defaulter diary`
                })
            }
            if (same_as_today.length > 0) {
                res.json({
                    success: false,
                    message: `Child with HEI number: ${check_client.hei_no} has an active appointment today. Kindly update the child from the appointment diary`
                })
            }
            if (future_date_exists.length > 0) {
                res.json({
                    success: false,
                    message: `Child with HEI number: ${check_client.hei_no} has an appointment scheduled for ${future_date_exists[0].appntmnt_date}. Kindly proceed to the UNSHEDULED HEI APPOINTMENT tab to book the child as an Un-Scheduled.`
                })
            }
        } else if (get_active_app === 0) {
            let hei_pcr6weeks = await PMTCTModule.findOne({
                where: {
                    hei_no: hei_number
                },
                raw: true
            })
            // let past_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').subtract(7, 'days').format('YYYY-MM-DD')
            // let next_week = moment(hei_pcr6weeks.pcr_week6, 'YYYY-MM-DD').add(7, 'days').format('YYYY-MM-DD')
            // if (!moment(appointment_date).isBetween(past_week, next_week))
            //     return res.json({
            //         success: false,
            //         message: `The appointment date you selected ${appointment_date} is past the range required for Week 6 IMMUNIZATION: ${hei_pcr6weeks.pcr_week6}. Please select a date between ${past_week} and ${next_week}`
            //     })
            return Appointment.create({
                app_status: 'Booked',
                appntmnt_date: appointment_date,
                status: "Active",
                sent_status: "Sent",
                client_id: check_client.id,
                created_at: today,
                created_by: check_user.id,
                app_type_1: appointment_type,
                entry_point: "Mobile",
                visit_type: "Scheduled",
                active_app: "1"
            }, {
                individualHooks: true,
            }).then((app) => {
                if (appointment_type == '6') {
                    return OtherAppointmentType.create({
                        name: appointment_other,
                        created_by: check_user.id,
                        created_at: today,
                        appointment_id: app.id

                    }).then((other_app) => {
                        let pmtct_entry = {}
                        pmtct_entry.client_id = check_client.id
                        pmtct_entry.appointment_date = appointment_date
                        pmtct_entry.created_by = check_user.id
                        pmtct_entry.appointment_id = app.id

                        let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                            return {
                                success: false,
                                message: e.message
                            }
                        })
                        if (new_pmtct) {
                            return res.json({
                                success: true,
                                message: `Appointment for ${check_client.f_name} HEI Number: ${hei_number} on ${appointment_date} was created successfully`

                            })
                        }

                    }).catch(e => {
                        return res.json({
                            success: false,
                            message: 'An error occured, could not create Appointment type other'
                        })
                    })
                }
                let pmtct_entry = {}
                pmtct_entry.client_id = check_client.id
                pmtct_entry.appointment_date = appointment_date
                pmtct_entry.created_by = check_user.id
                pmtct_entry.appointment_id = app.id

                let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                    return {
                        success: false,
                        message: e.message
                    }
                })
                if (new_pmtct) {
                    return res.json({
                        success: true,
                        message: `Appointment for ${check_client.f_name} HEI Number: ${hei_number} on ${appointment_date} was created successfully`

                    })
                } else {
                    console.log(e.message)
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
router.post('/book/hei/unscheduled', async (req, res) => {
    let phone_no = req.body.phone_no
    let hei_number = req.body.hei_number
    let appointment_date = req.body.appointment_date
    let appointment_type = req.body.appointment_type
    let appointment_other = req.body.appointment_other
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

    let check_client = await Client.findOne({
        where: {
            hei_no: hei_number
        }
    })
    if (!check_client)
        return res.json({
            success: false,
            message: `HEI number ${hei_number} does not exist in the system`
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
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (check_client.mfl_code != check_user.facility_id)
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} does not belong in your facility, the child is mapped to ${get_facility.name}`
        })
    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} is not mapped to your clinic, the child is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (get_clinic.id != 2)
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} is not mapped to PMTCT, the child is mapped to ${get_clinic.name}.`
        })
    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `HEI number: ${hei_number} is not active in the system.`
        })

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
            },
            raw: true
        })
        const future_date_exists = get_client_apps.filter(get_client => moment(get_client.appntmnt_date).isAfter(today))
        if (future_date_exists.length > 0) {
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
                    id: get_client_apps[0].id
                }
            }).then(async ([updated, next_app]) => {
                if (updated) {
                    return Appointment.create({
                        app_status: 'Booked',
                        appntmnt_date: appointment_date,
                        status: "Active",
                        sent_status: "Sent",
                        client_id: check_client.id,
                        created_at: today,
                        created_by: check_user.id,
                        app_type_1: appointment_type,
                        entry_point: "Mobile",
                        visit_type: "Scheduled",
                        active_app: "1"
                    }, {
                        individualHooks: true,
                    }).then((app) => {
                        if (appointment_type == '6') {
                            return OtherAppointmentType.create({
                                name: appointment_other,
                                created_by: check_user.id,
                                created_at: today,
                                appointment_id: app.id
                            }).then((other_app) => {
                                let pmtct_entry = {}
                                pmtct_entry.client_id = check_client.id
                                pmtct_entry.appointment_date = appointment_date
                                pmtct_entry.created_by = check_user.id
                                pmtct_entry.appointment_id = app.id

                                let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                                    return {
                                        success: false,
                                        message: e.message
                                    }
                                })
                                if (new_pmtct) {
                                    return res.json({
                                        success: true,
                                        message: `Appointment for ${check_client.f_name} HEI Number: ${hei_number} on ${appointment_date} was created successfully`

                                    })
                                }

                            }).catch(e => {
                                return res.json({
                                    success: false,
                                    message: 'An error occured, could not create Appointment type other'
                                })
                            })
                        }
                        let pmtct_entry = {}
                        pmtct_entry.client_id = check_client.id
                        pmtct_entry.appointment_date = appointment_date
                        pmtct_entry.created_by = check_user.id
                        pmtct_entry.appointment_id = app.id

                        let new_pmtct = PMTCTModule.create(pmtct_entry).catch((e) => {
                            return {
                                success: false,
                                message: e.message
                            }
                        })

                        if (new_pmtct) {
                            return res.json({
                                success: true,
                                message: `Appointment for ${check_client.f_name} HEI number: ${hei_number} on ${appointment_date} was created successfully`

                            })
                        } else {
                            console.log(e.message)
                        }
                    }).catch(e => {
                        return res.json({
                            success: false,
                            message: 'An error occured, could not create Appointment'

                        })
                    })
                }
            })

        } else {
            return res.json({
                success: false,
                message: `HEI Number: ${hei_number} does not have any future appointment`
            })
        }
    } else {
        return res.json({
            success: false,
            message: `HEI Number: ${hei_number} does not have any future appointment`
        })
    }
})
router.post('/register/hei/with/caregiver', async (req, res) => {
    let phone_no = req.body.phone_no
    let care_giver_fname = req.body.care_giver_fname
    let care_giver_mname = req.body.care_giver_mname
    let care_giver_lname = req.body.care_giver_lname
    let care_giver_phone = req.body.care_giver_phone
    let care_giver_gender = req.body.care_giver_gender
    let hei_no = req.body.hei_no
    let hei_gender = req.body.hei_gender
    let hei_dob = req.body.hei_dob
    let hei_first_name = req.body.hei_first_name
    let hei_middle_name = req.body.hei_middle_name
    let hei_last_name = req.body.hei_last_name

    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

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
    let get_user_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (check_user.clinic_id != '2')
        return res.json({
            success: false,
            message: `The User is not mapped to PMTCT, the user is mapped to ${get_user_clinic.name}`
        })

    if (moment(hei_dob).format('YYYY-MM-DD') > moment(today).format('YYYY-MM-DD'))
        return res.json({
            success: false,
            message: 'HEI Date of birth cannot be greater than today'
        })
    let check_hei = await PMTCTModule.findOne({
        where: {
            hei_no: hei_no
        }
    })
    if (check_hei) {
        return res.json({
            success: false,
            message: `HEI Number ${hei_no} already exists in the platform`
        })
    }

    let pcr6wks = moment(hei_dob, "YYYY-MM-DD").add(42, 'days')
    let pcr6months = moment(hei_dob, 'YYYY-MM-DD').add(6, 'months')
    let pcr12months = moment(hei_dob, 'YYYY-MM-DD').add(12, 'months')
    let care_giver_details = {}
    care_giver_details.care_giver_fname = care_giver_fname
    care_giver_details.care_giver_mname = care_giver_mname
    care_giver_details.care_giver_lname = care_giver_lname
    care_giver_details.care_giver_gender = care_giver_gender
    care_giver_details.care_giver_phone_number = care_giver_phone
    care_giver_details.hei_no = hei_no
    care_giver_details.created_by = check_user.id

    const [care_giver, created] = await CareGiver.findOrCreate({
        where: {
            hei_no
        },
        defaults: care_giver_details
    })
    if (created) {
        let hei_create = {}
        hei_create.hei_no = hei_no
        hei_create.hei_gender = hei_gender
        hei_create.hei_dob = hei_dob
        hei_create.hei_first_name = hei_first_name
        hei_create.hei_middle_name = hei_middle_name
        hei_create.hei_last_name = hei_last_name
        hei_create.type_of_care = 'No'
        hei_create.pcr_week6 = pcr6wks
        hei_create.pcr_month6 = pcr6months
        hei_create.pcr_month12 = pcr12months
        hei_create.created_by = check_user.id
        hei_create.care_giver_id = care_giver.id

        const [hei_child, created] = await PMTCTModule.findOrCreate({
            where: {
                hei_no: hei_create.hei_no
            },
            defaults: hei_create,
            raw: true
        })
        if (created) {
            let hei_ccc = Math.floor(Math.random() * 100000000000);
            let {
                id,
                pcr_week6,
                pcr_month6,
                pcr_month12,
                care_giver_id,
                client_id,
                type_of_care,
                appointment_date,
                updated_by,
                appointment_id,
                ...newObj

            } = hei_child
            const updatedObject = {
                ...newObj,
                clinic_id: 2,
                group_id: 3,
                clinic_number: hei_ccc,
                language_id: 1,
                f_name: hei_first_name,
                m_name: hei_middle_name,
                l_name: hei_last_name,
                gender: hei_gender,
                hei_no: hei_no,
                dob: hei_dob,
                client_status: 'No Condition',
                client_type: 'New',
                txt_time: 20,
                phone_no: care_giver.care_giver_phone_number,
                smsenable: 'Yes',
                status: 'Active',
                partner_id: check_user.partner_id,
                mfl_code: check_user.facility_id,
                created_by: check_user.id
            }
            updatedObject_new = {
                ...updatedObject
            }
            let save_hei_child = await Client.findOrCreate({
                where: {
                    clinic_number: updatedObject_new.clinic_number,
                    hei_no: updatedObject_new.hei_no
                },
                defaults: updatedObject
            }).then((data) => {
                return res.json({
                    success: true,
                    message: `HEI number ${hei_create.hei_no} has been created successfully in the system `
                })
            }).catch((error) => {
                return res.json({
                    success: false,
                    message: error.message
                })
            })
        } else {
            res.json({
                success: false,
                message: `HEI number ${hei_create.hei_no} already exists in the system`
            })
        }
    } else {
        res.json({
            success: false,
            message: `There is an existing care giver attached to the HEI Number: ${hei_no}`
        })
    }
})
router.post('/get/hei/details', async (req, res) => {
    let phone_no = req.body.user_phone
    let hei_no = req.body.hei_no

    let check_user = await User.findOne({
        where: {
            phone_no
        }
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} is not registered in the system`
        })

    let get_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ["id", "name"],
    })
    if (check_user.clinic_id != '2')
        return res.json({
            success: false,
            message: `The user is not mapped to PMTCT, the user is mapped to ${get_clinic.name}`
        })
    let hei_check = await Client.findOne({
        where: {
            hei_no
        },
        attributes: ['id', 'f_name', 'm_name', 'l_name', 'language_id', 'dob', 'phone_no', 'mfl_code', 'gender', 'clinic_id', 'hei_no']
    })
    if (!hei_check)
        return res.json({
            success: false,
            message: `HEI number ${hei_no} does not exist in the system.`
        })

    if (hei_check) {
        //we need the pri key on the pmtct table for the hei for processing updates in the next API...
        let hei_pri_key = await PMTCTModule.findOne({
            where: {
                hei_no: hei_check.hei_no
            }
        })
        let get_facility = await masterFacility.findOne({
            where: {
                code: hei_check.mfl_code
            },
            attributes: ['code', 'name']
        })
        if (hei_check.mfl_code != check_user.facility_id) {
            return res.json({
                success: false,
                message: `HEI number ${hei_no} is not mapped to your facility, the HEI is mapped to ${get_facility.name}. MFL Code: ${hei_check.mfl_code}`
            })
        } else {
            let hei_data = {}
            hei_data.id = hei_check.id
            hei_data.f_name = hei_check.f_name
            hei_data.m_name = hei_check.m_name
            hei_data.l_name = hei_check.l_name
            hei_data.language_id = hei_check.language_id
            hei_data.dob = hei_check.dob
            hei_data.phone_no = hei_check.phone_no
            hei_data.mfl_code = hei_check.mfl_code
            hei_data.gender = hei_check.gender
            hei_data.clinic_id = get_clinic.name
            hei_data.hei_no = hei_check.hei_no
            hei_data.hei_prim_key = hei_pri_key.id
            if (hei_data) {
                res.json({
                    success: true,
                    hei_data
                });
            } else {
                res.json({
                    success: false,
                    message: e.message
                });
            }
        }

    }
})
router.put('/update/hei/details/:id', async (req, res) => {
    try {
        let phone_no = req.body.user_phone
        get_user = await User.findOne({
            where: {
                phone_no
            }
        })
        if (!get_user) {
            return res.json({
                success: false,
                message: `Could not identify phone number ${get_user} in the system`
            })
        }
        //check if sent hei number exists in the DB
        check_hei_no = await Client.findOne({
            where: {
                hei_no: req.body.hei_no
            }
        })
        if (check_hei_no) {
            //check if its the same client id with same hei number or not
            if (check_hei_no.id != req.body.id) {
                return res.json({
                    success: false,
                    message: `HEI NUMBER: ${check_hei_no.hei_no} is already mapped to a different infant in the system.`
                })
            } else {
                return PMTCTModule.update({
                    hei_no: req.body.hei_no,
                    hei_gender: req.body.gender,
                    hei_first_name: req.body.f_name,
                    hei_middle_name: req.body.m_name,
                    hei_last_name: req.body.l_name,
                    hei_dob: req.body.dob,
                    updated_by: get_user.id


                }, {
                    where: {
                        id: req.body.hei_prim_key
                    }
                }).then((hei_upd) => {
                    //update clients table too
                    Client.findByPk(req.params.id).then((client) => {
                        client.update({
                            f_name: req.body.f_name,
                            m_name: req.body.m_name,
                            l_name: req.body.l_name,
                            language_id: req.body.language_id,
                            dob: req.body.dob,
                            phone_no: req.body.phone_no,
                            mfl_code: get_user.mfl_code,
                            gender: req.body.gender,
                            hei_no: req.body.hei_no,
                            updated_by: get_user.id

                        }).then((client) => {
                            res.json({
                                success: true,
                                message: `Child ${client.f_name} with HEI number: ${client.hei_no} has been successfully updated in the system. `

                            })
                        }).catch((error) => {
                            console.error(error)
                        })

                    })

                })
            }

        } else {
            //hei number dont exist, so update...
            return PMTCTModule.update({
                hei_no: req.body.hei_no,
                hei_gender: req.body.gender,
                hei_first_name: req.body.f_name,
                hei_middle_name: req.body.m_name,
                hei_last_name: req.body.l_name,
                hei_dob: req.body.dob,
                updated_by: get_user.id


            }, {
                where: {
                    id: req.body.hei_prim_key
                }
            }).then((hei_upd) => {
                Client.findByPk(req.params.id).then((client) => {
                    client.update({
                        f_name: req.body.f_name,
                        m_name: req.body.m_name,
                        l_name: req.body.l_name,
                        language_id: req.body.language_id,
                        dob: req.body.dob,
                        phone_no: req.body.phone_no,
                        mfl_code: get_user.mfl_code,
                        gender: req.body.gender,
                        hei_no: req.body.hei_no,
                        updated_by: get_user.id

                    }).then((client) => {
                        res.json({
                            success: true,
                            message: `Child ${client.f_name} with HEI number: ${client.hei_no} has been successfully updated in the system. `

                        })
                    }).catch((error) => {
                        console.error(error)
                    })

                })

            })

        }

        //return res.send(check_hei_no)

    } catch (e) {
        res.json({
            success: false,
            message: e.message
        })
    }


})

router.post('/pcr/positive/details', async (req, res) => {
    let phone_no = req.body.user_phone
    let hei_no = req.body.hei_no

    let check_user = await User.findOne({
        where: {
            phone_no
        }
    })
    if (!check_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} is not registered in the system`
        })
    let get_clinic = await Clinic.findOne({
        where: {
            id: check_user.clinic_id
        },
        attributes: ['id', 'name']
    })
    if (check_user.clinic_id != '2')
        return res.json({
            success: false,
            message: `The user is not mapped to PMTCT, the user is mapped to ${get_clinic.name}`
        })
    let hei_check = await Client.findOne({
        where: {
            hei_no
        },
        attributes: ['id', 'clinic_number', 'dob', 'client_status', 'enrollment_date', 'art_date',
            'motivational_enable', 'file_no', 'hei_no', 'mfl_code'
        ]

    })
    if (!hei_check)
        return res.json({
            success: false,
            message: `HEI number ${hei_no} does not exist in the system.`
        })
    if (hei_check) {
        let get_facility = await masterFacility.findOne({
            where: {
                code: hei_check.mfl_code
            },
            attributes: ['code', 'name']
        })
        if (hei_check.mfl_code != check_user.facility_id) {
            return res.json({
                success: false,
                message: `HEI number ${hei_no} is not mapped to your facility, the HEI is mapped to ${get_facility.name}. MFL Code: ${hei_check.mfl_code}`
            })
        } else {
            let hei_details = {}
            hei_details.id = hei_check.id
            hei_details.clinic_number = hei_check.clinic_number
            hei_details.client_status = hei_check.client_status
            hei_details.enrollment_date = hei_check.enrollment_date
            hei_details.art_date = hei_check.art_date
            hei_details.motivational_enable = hei_check.motivational_enable
            hei_details.file_no = hei_check.file_no
            hei_details.hei_no = hei_check.hei_no
            hei_details.dob = hei_check.dob

            if (hei_details) {
                res.json({
                    success: true,
                    message: hei_details
                })
            } else {
                res.json({
                    success: false,
                    message: 'An error occured, please try again'
                });
            }


        }
    }

})
router.put('/enroll/positive/pcr/:id', async (req, res) => {
    try {
        let today = moment(new Date().toDateString()).format("YYYY-MM-DD")
        let phone_no = req.body.user_phone
        get_user = await User.findOne({
            where: {
                phone_no
            }
        })
        if (!get_user) {
            return res.json({
                success: false,
                message: `Could not identify phone number ${get_user} in the system`
            })
        }
        check_ccc = await Client.findOne({
            where: {
                clinic_number: req.body.clinic_number
            }
        })
        if (check_ccc) {
            return res.json({
                success: false,
                message: `Clinic number ${req.body.clinic_number} already exists in the system. Kindly assign the client another 10-digit UPN.`
            })
        }
        Client.findByPk(req.params.id).then((client) => {
            client.update({
                clinic_number: req.body.clinic_number,
                client_status: req.body.client_status,
                enrollment_date: req.body.enrollment_date,
                art_date: req.body.art_date,
                motivational_enable: req.body.motivational_enable,
                file_no: req.body.file_no,
                group_id: '8',
                marital: '6'

            }).then((client) => {
                return PMTCTModule.update({
                    date_confirmed_positive: today,
                    updated_by: get_user.id
                }, {
                    where: {
                        hei_no: req.body.hei_no
                    }
                }).then((date_confirm) => {
                    res.json({
                        success: true,
                        message: `HEI Child: ${client.hei_no} has been successfully enrolled into care with UPN: ${client.clinic_number}. The child will remain in PMTCT Clinic.`
                    })

                })
            }).catch((error) => {
                console.log(error)
            })
        })


    } catch (e) {
        res.json({
            success: false,
            message: e.message
        })
    }
})
router.post('/outcome/get/details', async (req, res) => {
    let phone_no = req.body.phone_no
    let hei_no = req.body.hei_no

    //validate user existence...
    let get_user = await User.findOne({
        where: {
            phone_no
        }
    })
    if (!get_user)
        return res.json({
            success: false,
            message: `Phone number ${phone_no} does not exist in the system`
        })

    //validate client existence...
    let get_client = await Client.findOne({
        where: {
            hei_no
        }
    })
    if (!get_client)
        return res.json({
            success: false,
            message: `HEI Number: ${hei_no} does not exist in the system`
        })

    //clinic and facility validation checks... 

    let get_user_clinic = await Clinic.findOne({
        where: {
            id: get_user.clinic_id
        },
        attributes: ["id", "name"],
    })

    let get_clinic = await Clinic.findOne({
        where: {
            id: get_client.clinic_id
        },
        attributes: ["id", "name"],
    })
    let get_facility = await masterFacility.findOne({
        where: {
            code: get_client.mfl_code
        },
        attributes: ["code", "name"],
    })
    if (get_client.clinic_id != get_user.clinic_id)
        return res.json({
            success: false,
            message: `HEI Number ${hei_no} is not mapped to your clinic, the HEI is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (get_clinic.id != 2)
        return res.json({
            success: false,
            message: `HEI: ${hei_no} is not mapped to PMTCT, the HEI is mapped to ${get_clinic.name}. Please do a move clinic on the last icon in the appointment diary`
        })
    if (get_client.mfl_code != get_user.facility_id)
        return res.json({
            success: false,
            message: `HEI Number: ${hei_no} does not belong in your facility, the HEI is mapped to ${get_facility.name}. With MFL CODE: ${get_facility.code}`
        })

    if (get_client.status != "Active")
        return res.json({
            success: false,
            message: `HEI: ${hei_no} is not active in the system.`
        })
    //get months old of hei...
    let now = moment(new Date()).format("YYYY-MM-DD");
    let dob_of_hei = moment(get_client.dob).format('YYYY-MM-DD')
    let monthdiff = Math.round(moment(now).diff(dob_of_hei, 'months', true))
    console.log(monthdiff)
    let hei_data = {}
    hei_data.id = get_client.id
    hei_data.f_name = get_client.f_name
    hei_data.m_name = get_client.m_name
    hei_data.l_name = get_client.l_name
    hei_data.dob = get_client.dob
    hei_data.months = monthdiff

    if (hei_data) {
        res.json({
            success: true,
            message: hei_data
        })
    } else {
        res.json({
            success: false,
            message: 'An error occured, please try again'
        })
    }


})
router.post('/confirm/final/outcome', async (req, res) => {
    let phone_no = req.body.phone_no
    let hei_no = req.body.hei_no
    let outcome = req.body.outcome
    let date_died = req.body.date_deceased
    let date_transfer = req.body.date_transfer
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")
    try {
        if (outcome == '1') {
            let get_user = await User.findOne({
                where: {
                    phone_no
                }
            })

            let hei_details = await Client.findOne({
                where: {
                    hei_no
                }
            })
            //return res.send(hei_details)
            Client.findByPk(hei_details.id).then((client) => {
                client.update({
                    status: 'Deceased',
                    updated_by: get_user.id,
                    date_deceased: date_died

                }).then(async (client) => {
                    //get active apps 
                    let get_active_apps = await Appointment.findOne({
                        where: {
                            client_id: client.id,
                            active_app: '1'
                        },
                    })
                    if (get_active_apps) {
                        return Appointment.update({
                            expln_app: `Marked Deceased on: ${today}.  By User: ${get_user.id}`,
                            active_app: '0',
                            updated_at: today,
                            updated_by: get_user.id,
                            appointment_kept: 'No'
                        }, {
                            where: {
                                id: get_active_apps.id
                            }
                        }).then((done) => {
                            res.json({
                                success: true,
                                message: `Final Outcome, 'DECEASED' has been successfully updated for HEI: ${hei_no} `
                            })
                        }).catch((error) => {
                            res.json({
                                success: false,
                                message: 'An error occurred, please try again.'
                            })
                        })
                    } else {
                        res.json({
                            success: true,
                            message: `Final Outcome, 'DECEASED' has been successfully updated for HEI: ${hei_no} `
                        })
                    }
                })
            })

        } else if (outcome == '2') {
            let get_user = await User.findOne({
                where: {
                    phone_no
                }
            })

            let hei_details = await Client.findOne({
                where: {
                    hei_no
                }
            })

            Client.findByPk(hei_details.id).then((client) => {
                client.update({
                    status: 'LTFU',
                    updated_by: get_user.id
                }).then(async (client) => {
                    let get_active_apps = await Appointment.findOne({
                        where: {
                            client_id: client.id,
                            active_app: '1'
                        },
                    })
                    if (get_active_apps) {
                        return Appointment.update({
                            expln_app: `Marked LTFU on: ${today}.  By User: ${get_user.id}`,
                            active_app: '0',
                            updated_at: today,
                            updated_by: get_user.id,
                            appointment_kept: 'No'
                        }, {
                            where: {
                                id: get_active_apps.id
                            }
                        }).then((done) => {
                            res.json({
                                success: true,
                                message: `Final Outcome, 'LTFU' has been successfully updated for HEI: ${hei_no} `
                            })
                        }).catch((error) => {
                            res.json({
                                success: false,
                                message: 'An error occurred, please try again.'
                            })
                        })
                    } else {
                        res.json({
                            success: true,
                            message: `Final Outcome, 'LTFU' has been successfully updated for HEI: ${hei_no} `
                        })
                    }
                })
            })
        } else if (outcome == '3') {
            let get_user = await User.findOne({
                where: {
                    phone_no
                }
            })

            let hei_details = await Client.findOne({
                where: {
                    hei_no
                }
            })

            Client.findByPk(hei_details.id).then((client) => {
                client.update({
                    status: 'Transfer Out',
                    updated_by: get_user.id,
                    transfer_date: date_transfer
                }).then(async (client) => {
                    let get_active_apps = await Appointment.findOne({
                        where: {
                            client_id: client.id,
                            active_app: '1'
                        },
                    })
                    if (get_active_apps) {
                        return Appointment.update({
                            expln_app: `Marked Transfer Out on: ${today}.  By User: ${get_user.id}`,
                            active_app: '0',
                            updated_at: today,
                            updated_by: get_user.id,
                            appointment_kept: 'No'
                        }, {
                            where: {
                                id: get_active_apps.id
                            }
                        }).then((done) => {
                            res.json({
                                success: true,
                                message: `Final Outcome, 'Transfer Out' has been successfully updated for HEI: ${hei_no} `
                            })
                        }).catch((error) => {
                            res.json({
                                success: false,
                                message: 'An error occurred, please try again.'
                            })
                        })
                    } else {
                        res.json({
                            success: true,
                            message: `Final Outcome, 'Transfer Out' has been successfully updated for HEI: ${hei_no} `
                        })
                    }
                })
            })
        } else if (outcome == '4') {
            let get_user = await User.findOne({
                where: {
                    phone_no
                }
            })

            let hei_details = await Client.findOne({
                where: {
                    hei_no
                }
            })
            Client.findByPk(hei_details.id).then((client) => {
                client.update({
                    clinic_id: '1',
                    updated_by: get_user.id
                }).then((client) => {
                    res.json({
                        success: true,
                        message: `Child ${client.f_name} with HEI Number: ${client.hei_no} and CCC Number: ${client.clinic_number} has been successfully moved to the PSC clinic.`
                    })
                }).catch((error) => {
                    res.json({
                        success: false,
                        message: 'An error occurred, please try again.'
                    })
                })
            })
        } else if (outcome == '5') {
            let get_user = await User.findOne({
                where: {
                    phone_no
                }
            })

            let hei_details = await Client.findOne({
                where: {
                    hei_no
                }
            })

            Client.findByPk(hei_details.id).then((client) => {
                client.update({
                    status: 'Disabled',
                    updated_by: get_user.id
                }).then(async (client) => {
                    let active_apps = await Appointment.findOne({
                        where: {
                            client_id: client.id,
                            active_app: '1'
                        },
                    })
                    if (active_apps) {
                        return Appointment.update({
                            expln_app: `Discharged From PMTCT on: ${today}. By User: ${get_user.id}`,
                            active_app: '0',
                            updated_at: today,
                            updated_by: get_user.id,
                            appointment_kept: 'No'
                        }, {
                            where: {
                                id: active_apps.id
                            }
                        }).then((app_done) => {
                            res.json({
                                success: true,
                                message: `HEI Number ${client.hei_no}: has been successfully discharged from PMTCT. `
                            })
                        }).catch((error) => {
                            res.json({
                                success: false,
                                message: 'An error occurred, please try again.'
                            })
                        })
                    } else {
                        res.json({
                            success: true,
                            message: `HEI Number ${client.hei_no}: has been successfully discharged from PMTCT. `
                        })
                    }
                })
            })
        } else {
            res.json({
                success: false,
                message: 'No outcome selected, please try again.'
            })
        }

    } catch (error) {
        res.json({
            success: false,
            message: 'An error occurred, please try again.'
        })
    }


})

module.exports = router;
