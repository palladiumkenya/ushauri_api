const { validateClient, Client } = require("../models/client");
const express = require("express");
const router = express.Router();
// const bcrypt = require("bcrypt");
const _ = require("lodash");
const { Partner } = require("../models/partner");
const { PartnerFacility } = require("../models/partner_facility");
const { User } = require("../models/user");
const { masterFacility } = require("../models/master_facility");

router.get("/", async (req, res) => {
	let clients = await Client.findAll({ limit: 0 });
	if (!clients) return res.status(400).send("No Clients found");
	res.send(
		clients.map(
			({
				clinic_number,
				f_name,
				m_name,
				l_name,
				dob,
				phone_no,
				mfl_code,
				status,
				client_status,
				gender,
				marital,
				smsenable,
				createdAt
			}) => ({
				clinic_number,
				f_name,
				m_name,
				l_name,
				dob,
				phone_no,
				mfl_code,
				status,
				client_status,
				gender,
				marital,
				smsenable,
				createdAt
			})
		)
	);
});

router.get("/partner", async (req, res) => {
	let partner = await Partner.findAll({ limit: 100 });
	res.send(partner);
});

router.get("/partner/:id", async (req, res) => {
	let partner = await Partner.findOne({ where: { id: req.params.id } });
	res.send(partner);
});

router.get("/partner/facilities/:id", async (req, res) => {
	let partner = await PartnerFacility.findAll({
		where: { partner_id: req.params.id },
		attributes: ["mfl_code"]
	});
	let mfl_codes = partner.map((obj) => {
		return obj.mfl_code;
	});
	mfl_codes.join(",");
	res.send(mfl_codes);
});

router.get("/:id", async (req, res) => {
	const id = req.params.id;
	const client = await Client.findByPk(id);

	if (!client)
		return res
			.status(400)
			.send(`Client with the given id: ${id} was not found`);
	res.send(
		_.pick(client, [
			"clinic_number",
			"f_name",
			"m_name",
			"l_name",
			"dob",
			"phone_no",
			"mfl_code",
			"status",
			"client_status",
			"gender",
			"marital",
			"smsenable",
			"createdAt"
		])
	);
});

router.post("/", async (req, res) => {
	const { error } = validateClient(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	let client = await Client.findOne({
		where: {
			phone_no: req.body.phone_no
		}
	});

	// return res.send(_.isEmpty(client));

	if (!_.isEmpty(client))
		return res
			.status(400)
			.send(`Phone number: ${req.body.phone_no} already exists in the system.`);

	client = await Client.findOne({
		where: {
			email: req.body.email
		}
	});

	if (!_.isEmpty(client))
		return res
			.status(400)
			.send(`Email: ${req.body.email} already exists in the system.`);

	client = req.body;
	// const salt = await bcrypt.genSalt(10);
	// client.password = await bcrypt.hash(client.phone_no, salt);

	client.first_access = "Yes";
	if ((client.access_level = "Admin")) {
		client.partner_id = 100;
		client.role_id = 1;
		client.rcv_app_list = "No";
	}

	Client.create(client)
		.then(function (model) {
			message = "OK";
			response = "Client successfully added.";

			res.json({
				message: message,
				response: {
					msg: response,
					client: _.pick(client, [
						"id",
						"f_name",
						"m_name",
						"l_name",
						"dob",
						"phone_no",
						"email",
						"partner_id",
						"facility_id",
						"status",
						"clinic_id",
						"createdAt"
					])
				}
			});
		})
		.catch(function (err) {
			code = 500;
			response = err.message;

			res.json({
				response: {
					msg: response,
					error: err
				}
			});
		});
});

router.put("/:id", async (req, res) => {
	let client = await Client.findByPk(req.params.id);

	if (!client)
		return res
			.status(400)
			.send(`Client with the given id: ${req.params.id} was not found`);

	Client.update(req.body, { returning: true, where: { id: req.params.id } })
		.then(function ([rowsUpdate, [updatedClient]]) {
			message = "OK";
			response = "Client successfully updated.";

			res.json({
				message: message,
				response: {
					msg: response,
					client: _.pick(updatedClient, [
						"id",
						"f_name",
						"m_name",
						"l_name",
						"dob",
						"phone_no",
						"email",
						"partner_id",
						"facility_id",
						"status",
						"clinic_id",
						"createdAt"
					])
				}
			});
		})
		.catch(function (err) {
			code = 500;
			response = err.message;

			res.json({
				response: {
					msg: response,
					error: err
				}
			});
		});
});

router.delete("/:id", async (req, res) => {
	let client = await Client.findByPk(req.params.id);

	if (!client)
		return res
			.status(400)
			.send(`Client with the given id: ${req.params.id} was not found`);

	Client.destroy({
		where: { id: req.params.id }
	})
		.then((deletedClient) => {
			message = "OK";
			response = "Client successfully deleted.";
			res.json({
				message: message,
				response: {
					msg: response,
					client: deletedClient
				}
			});
		})
		.catch(function (err) {
			code = 500;
			response = err.message;

			res.json({
				response: {
					msg: response,
					error: err
				}
			});
		});
});

router.get("/api/search", async (req, res) => {
	try {
		let clinicNumber = req.query.clinic_number;
		let phone_no = req.query.phone_no;

		let client = await Client.findOne({
			where: {
				clinic_number: clinicNumber
			}
		});

		if (!client) {
			return res.status(400).json({
				success: false,
				message: "No Clients found"
			});
		}

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

		if (!check_user) {
			return res.json({
				success: false,
				message: `Phone number ${phone_no} does not exist in the system`
			});
		}

		if (client.mfl_code != check_user.facility_id) {
			return res.json({
				success: false,
				message: `Client ${clinicNumber} does not belong to your facility, the client belongs to ${get_facility.name}`
			});
		}

		if (client.status != "Active") {
			return res.json({
				success: false,
				message: `Client: ${clinicNumber} is not active in the system.`
			});
		}

		if (check_user.status != "Active") {
			return res.json({
				success: false,
				message: `Phone number: ${phone_no} is not active in the system.`
			});
		}

		const mappedClient = mapClient(client);

		res.json({
			success: true,
			data: mappedClient
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Internal Server Error"
		});
	}
});

// map gender
function mapGender(gender) {
	if (gender === 1) {
		return "Female";
	} else if (gender === 2) {
		return "Male";
	} else {
		return "Unknown";
	}
}
function mapMarital(marital) {
	if (marital === 1) {
		return "Single";
	} else if (marital === 2) {
		return "Married Monogamous";
	} else if (marital === 3) {
		return "Divorced";
	}else if (marital === 4) {
		return "Widowed";
	}else if (marital === 5) {
		return "Cohabiting";
	}else if (marital === 6) {
		return "Unavailable";
	}else if (marital === 7) {
		return "Not Applicable";
	}else if (marital === 8) {
		return "Married polygamous";
	}else {
		return "Unknown";
	}
}

function mapClient(client) {
	return {
		clinic_number: client.clinic_number,
		f_name: client.f_name,
		m_name: client.m_name,
		l_name: client.l_name,
		dob: client.dob,
        file_no: client.file_no,
        upi_no: client.upi_no,
		phone_no: client.phone_no,
		mfl_code: client.mfl_code,
		status: client.status,
		client_status: client.client_status,
		gender: mapGender(client.gender),
		marital: mapMarital(client.marital),
		smsenable: client.smsenable,
		createdAt: client.createdAt
	};
}

module.exports = router;
