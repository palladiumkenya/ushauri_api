const express = require("express");
const moment = require("moment");
const _ = require("lodash");
const { Op, Sequelize } = require("sequelize");
const router = express.Router();
const { date } = require("joi");
const { caseAssign } = require("../../models/case_assign");
const { Client } = require("../../models/client");
const { User } = require("../../models/user");
const { masterFacility } = require("../../models/master_facility");
const { caseHome } = require("../../models/case_home");

router.post("/assign", async (req, res) => {
	let phone_no = req.body.phone_no;
	let clinic_number = req.body.clinic_number;
	let reason_assign = req.body.reason_assign;
	let other_reason = req.body.other_reason;
	let provider_id = req.body.provider_id;
	let relationship = req.body.relationship;
	let start_date = req.body.start_date;
	let end_date = req.body.end_date;
	let today = moment(new Date().toDateString()).tz("Africa/Nairobi").format("YYYY-MM-DD H:M:S");

	let check_client = await Client.findOne({
		where: {
			clinic_number: clinic_number
		}
	});

	if (!check_client)
		return res.json({
			success: false,
			message: `Clinic number ${clinic_number} does not exist in the system`
		});
	let check_user = await User.findOne({
		where: {
			phone_no
		}
	});
	let get_facility = await masterFacility.findOne({
		where: {
			code: check_client.mfl_code
		},
		attributes: ["code", "name"]
	});
	if (check_client.mfl_code != check_user.facility_id)
		return res.json({
			success: false,
			message: `Client ${clinic_number} does not belong to your facility, the client belongs to ${get_facility.name}`
		});

	if (!check_user)
		return res.json({
			success: false,
			message: `Phone number ${phone_no} does not exist in the system`
		});
	if (check_client.status != "Active")
		return res.json({
			success: false,
			message: `Client: ${clinic_number} is not active in the system.`
		});
	if (check_user.status != "Active")
		return res.json({
			success: false,
			message: `Phone number: ${phone_no} is not active in the system.`
		});

	let existing_assigned = await caseAssign.findOne({
		where: {
			client_id: check_client.id
		}
	});

	if (existing_assigned) {
		return res.status(400).json({
			success: false,
			message: `Client ${clinic_number} is already assigned to a case manager`
		});
	} else {
		try {
			await caseAssign.create({
				client_id: check_client.id,
				reason_assign: reason_assign,
				provider_id: provider_id,
				other_reason: other_reason,
				relationship: relationship,
				start_date: start_date,
				end_date: end_date,
				created_at: today,
				created_by: check_user.id
			});
			return res.status(200).json({
				success: true,
				message: `Client ${clinic_number} has been successfully assigned to a case manager`
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: `Error occurred while assigning a case. Please try again.`
			});
		}
	}
});

router.put("/assign/update/:clinicNumber", async (req, res) => {
	const clinicNumber = req.params.clinicNumber;

	let phone_no = req.body.phone_no;
	let reason_assign = req.body.reason_assign;
	let other_reason = req.body.other_reason;
	let provider_id = req.body.provider_id;
	let relationship = req.body.relationship;
	let start_date = req.body.start_date;
	let end_date = req.body.end_date;
	let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

	try {
		let client = await Client.findOne({
			where: {
				clinic_number: clinicNumber
			}
		});

		if (!client) {
			return res.status(404).json({
				success: false,
				message: `Clinic number ${clinicNumber} does not exist in the system`
			});
		}

		let check_user = await User.findOne({
			where: {
				phone_no
			}
		});

		if (!check_user)
			return res.json({
				success: false,
				message: `Phone number ${phone_no} does not exist in the system`
			});
		if (client.status != "Active")
			return res.json({
				success: false,
				message: `Client: ${clinic_number} is not active in the system.`
			});
		if (check_user.status != "Active")
			return res.json({
				success: false,
				message: `Phone number: ${phone_no} is not active in the system.`
			});

		let existingCase = await caseAssign.findOne({
			where: {
				client_id: client.id
			}
		});

		if (!existingCase) {
			return res.status(404).json({
				success: false,
				message: `Client: ${clinicNumber} has not been assigned to a case`
			});
		}

		return caseAssign
			.update(
				{
					reason_assign: reason_assign,
					provider_id: provider_id,
					other_reason: other_reason,
					relationship: relationship,
					start_date: start_date,
					end_date: end_date,
					updated_at: today,
					updated_by: check_user.id
				},
				{ where: { client_id: client.id } }
			)
			.then(([updated]) => {
				if (updated > 0) {
					return res.status(200).json({
						success: true,
						message: `Client: ${clinicNumber} case details have been updated successfully`
					});
				} else {
					return res.status(404).json({
						success: false,
						message: `Client: ${clinicNumber} case details were not found or could not be updated`
					});
				}
			});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Error occurred while updating the case. Please try again.`
		});
	}
});

router.get("/search", async (req, res) => {
	try {
		let clinicNumber = req.query.clinic_number;
		let phone_no = req.query.phone_no;

		let client = await Client.findOne({
			where: {
				clinic_number: clinicNumber
			}
		});

		let get_facility = await masterFacility.findOne({
			where: {
				code: client.mfl_code
			},
			attributes: ["code", "name"]
		});
		let check_user = await User.findOne({
			where: {
				phone_no
			}
		});

		if (!client) {
			return res.json({
				success: false,
				message: `Clinic number ${clinicNumber} does not exist in the system`
			});
		}
		if (client.mfl_code != check_user.facility_id)
			return res.json({
				success: false,
				message: `Client ${clinicNumber} does not belong to your facility, the client belongs to ${get_facility.name}`
			});

		const cases = await caseAssign.findOne({
			where: {
				client_id: client.id
			}
		});

		if (!cases || cases.length === 0) {
			return res.status(400).json({
				success: false,
				message: `No case found for Client ${clinicNumber}`
			});
		} else {
			const getCases = Array.isArray(cases)
				? cases.map(
						({
							reason_assign,
							other_reason,
							relationship,
							start_date,
							end_date
						}) => ({
							reason_assign,
							other_reason,
							relationship,
							start_date,
							end_date
						})
				  )
				: [cases];

			res.send(getCases);
		}
	} catch (error) {
		console.error(error);
		res.status(500).send("Error while getting cases");
	}
});

router.post("/home/visit", async (req, res) => {
	let phone_no = req.body.phone_no;
	let clinic_number = req.body.clinic_number;
	let family_member_name = req.body.family_member_name;
	let telephone_no = req.body.telephone_no;
	let landmark = req.body.landmark;
	let patient_independent = req.body.patient_independent;
	let basic_need = req.body.basic_need;
	let sexual_partner = req.body.sexual_partner;
	let disclosed_hiv_status = req.body.disclosed_hiv_status;
	let disclosed_person = req.body.disclosed_person;
	let arv_stored = req.body.arv_stored;
	let arv_taken = req.body.arv_taken;
	let social_support_household = req.body.social_support_household;
	let social_support_community = req.body.social_support_community;
	let non_clinical_services = req.body.non_clinical_services;
	let mental_health = req.body.mental_health;
	let stress_situation = req.body.stress_situation;
	let use_drug = req.body.use_drug;
	let side_effect = req.body.side_effect;
	let other_note = req.body.other_note;
	let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

	let check_client = await Client.findOne({
		where: {
			clinic_number
		}
	});
	let get_facility = await masterFacility.findOne({
		where: {
			code: check_client.mfl_code
		},
		attributes: ["code", "name"]
	});
	let check_user = await User.findOne({
		where: {
			phone_no
		}
	});

	let existingVisit = await caseHome.findOne({
		where: {
			client_id: check_client.id,
			[Op.and]: [Sequelize.literal(`DATE(created_at) = '${today}'`)]
		}
	});

	if (existingVisit) {
		return res.status(400).json({
			success: false,
			message: `Home Visit details for Client: ${clinic_number} have already been captured today`
		});
	} else {
		try {
			await caseHome.create({
				client_id: check_client.id,
				family_member_name: family_member_name,
				telephone_no: telephone_no,
				landmark: landmark,
				patient_independent: patient_independent,
				basic_need: basic_need,
				sexual_partner: sexual_partner,
				disclosed_hiv_status: disclosed_hiv_status,
				disclosed_person: disclosed_person,
				arv_stored: arv_stored,
				arv_taken: arv_taken,
				social_support_household: social_support_household,
				social_support_community: social_support_community,
				non_clinical_services: non_clinical_services,
				mental_health: mental_health,
				stress_situation: stress_situation,
				use_drug: use_drug,
				side_effect: side_effect,
				other_note: other_note,
				created_at: today,
				created_by: check_user.id
			});
			return res.status(200).json({
				success: true,
				message: `Client ${clinic_number} details has been successfully captured`
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: `Error occurred while capturing details. Please try again.`
			});
		}
	}
});

module.exports = router;
