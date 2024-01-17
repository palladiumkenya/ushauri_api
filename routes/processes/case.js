const express = require("express");
const moment = require("moment");
const _ = require("lodash");
const Op = require("sequelize").Op;
const router = express.Router();
const { date } = require("joi");
const { caseAssign } = require("../../models/case_assign");
const { Client } = require("../../models/client");
const { User } = require("../../models/user");
const { masterFacility } = require("../../models/master_facility");

router.post("/assign", async (req, res) => {
	let phone_no = req.body.phone_no;
	let clinic_number = req.body.clinic_number;
	let reason_assign = req.body.reason_assign;
	let other_reason = req.body.other_reason;
	let provider_id = req.body.provider_id;
	let relationship = req.body.relationship;
	let start_date = req.body.start_date;
	let end_date = req.body.end_date;
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

	if (!check_client)
		return res.json({
			success: false,
			message: `Clinic number ${clinic_number} does not exist in the system`
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

	let existing_assigned = await caseAssign.count({
		where: {
			client_id: check_client.id
		}
	});

	if (existing_assigned === 0) {
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
	} else {
		return res.status(400).json({
			success: false,
			message: `Client ${clinic_number} is already assigned to a case manager`
		});
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
			return res.status(404).json({
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

module.exports = router;
