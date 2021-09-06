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
    Clinic
} = require("../../models/clinic");
const {
    masterFacility
} = require('../../models/master_facility');
const {
    create
} = require("lodash");
const {
    AppointmentType
} = require("../../models/appointment_type");
//const e = require("express");
moment.createFromInputFallback = function(config) {
    config._d = new Date(config._i);
};

router.post('/get/client/apps', async(req, res) => {
    let clinic_number = req.body.clinic_number
    let phone_no = req.body.phone_no
    let today = moment(new Date().toDateString()).format("YYYY-MM-DD")

    //validate and authenticate user and client...
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

    let check_client = await Client.findOne({
        where: {
            [Op.or]: [{
                clinic_number: clinic_number,
            }, {
                hei_no: clinic_number
            }, ]
        },
        //these are what we need...
        attributes: [
            "id",
            "f_name",
            "m_name",
            "l_name",
            "clinic_number",
            "hei_no",
            "mfl_code",
            "clinic_id",
            'status'
        ]
    })
    if (!check_client)
        return res.json({
            success: false,
            message: `No client is registered with CCC: ${req.body.clinic_number} or HEI Number: ${req.body.clinic_number} `
        })

    let get_facility = await masterFacility.findOne({
        where: {
            code: check_client.mfl_code
        },
        attributes: ['code', 'name']
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
            message: `Client ${clinic_number} does not belong in your facility, the client is mapped to ${get_facility.name} with mfl code: ${get_facility.code}`
        })

    if (check_client.clinic_id != check_user.clinic_id)
        return res.json({
            success: false,
            message: `Client ${clinic_number} is not mapped to your clinic, the client is mapped in ${get_clinic.name} and the current phone number is mapped in ${get_user_clinic.name}`
        })
    if (check_client.status != "Active")
        return res.json({
            success: false,
            message: `Client: ${clinic_number} is not active in the system. The client is marked as ${check_client.status}. Kindly do an update in the registration icon to activate the client back to care.`
        })

    //let us look for the future existing appointments... 
    let get_client_apps = await Appointment.findAll({
        where: {
            client_id: check_client.id,
            active_app: '1'
        },
        attributes: ['id', 'client_id', 'appntmnt_date', 'app_type_1', 'expln_app', 'updated_by'],
        raw: true,
        include: [{
            model: AppointmentType,
            as: "app_type",
            required: true
        }]
    })


    //then we loop through them since we used the findAll method above...
    let arr_data = []
    const future_date_exists = get_client_apps.filter(get_data => moment(get_data.appntmnt_date).isAfter(today))
    if (future_date_exists.length > 1) {
        let client_data = {}
        client_data.appointment_id = future_date_exists[0].id
        client_data.f_name = check_client.f_name
        client_data.m_name = check_client.m_name
        client_data.l_name = check_client.l_name
        client_data.clinic_number = check_client.clinic_number
        client_data.hei_no = check_client.hei_no
        client_data.clinic = get_clinic.name
        client_data.appointment_date = future_date_exists[0].appntmnt_date
        client_data.appointment_type = future_date_exists[0]["app_type.name"]

        let client_data_two = {}
        client_data_two.appointment_id = future_date_exists[1].id
        client_data_two.f_name = check_client.f_name
        client_data_two.m_name = check_client.m_name
        client_data_two.l_name = check_client.l_name
        client_data_two.clinic_number = check_client.clinic_number
        client_data_two.hei_no = check_client.hei_no
        client_data_two.clinic = get_clinic.name
        client_data_two.appointment_date = future_date_exists[1].appntmnt_date
        client_data_two.appointment_type = future_date_exists[1]["app_type.name"]
            //push the two objects to one array if client has more than one active future appointment...
        arr_data.push(client_data, client_data_two)
        if (arr_data) {
            return res.json({
                success: true,
                arr_data

            })
        } else {
            return res.json({
                success: false,
                message: 'An error occured, please try again'
            })
        }

    } else if (future_date_exists.length == 1) {
        let client_data = {}
        client_data.appointment_id = future_date_exists[0].id
        client_data.f_name = check_client.f_name
        client_data.m_name = check_client.m_name
        client_data.l_name = check_client.l_name
        client_data.clinic_number = check_client.clinic_number
        client_data.hei_no = check_client.hei_no
        client_data.clinic = get_clinic.name
        client_data.appointment_date = future_date_exists[0].appntmnt_date
        client_data.appointment_type = future_date_exists[0]["app_type.name"]
        arr_data.push(client_data)

        if (client_data) {
            return res.json({
                success: true,
                arr_data

            })
        } else {
            return res.json({
                success: false,
                message: 'An error occured, please try again'
            })
        }
    } else {
        return res.json({
            success: false,
            message: 'No future appointments exist for the client'
        })
    }



})
router.put('/edit/appointment/date/:appointment_id', async(req, res) => {
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
        Appointment.findByPk(req.params.appointment_id).then((appointment) => {
            appointment.update({
                appntmnt_date: req.body.appointment_date,
                expln_app: 'EDITED',
                updated_by: get_user.id
            }).then((appointment) => {
                res.json({
                    success: true,
                    message: 'Appointment Edited Successfully'
                })
            })
        })
    } catch (error) {
        console.error(error)
    }
})
module.exports = router;