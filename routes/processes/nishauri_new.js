const express = require("express");
const router = express.Router();
//const sequelize = require("../../db_config");

const request = require("request");
const https = require("https");
const moment = require("moment");
const base64 = require("base64util");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
const { Buffer } = require("buffer");
const axios = require("axios");

const admin = require("firebase-admin");
const cron = require("node-cron");

const users = [];

module.exports = { router, users };
require("dotenv").config();
//const Op = require("sequelize");
const { Op, fn, col, literal, QueryTypes } = require("sequelize");
var bcrypt = require("bcrypt");
const crypto = require("crypto");

// const sequelize = require("sequelize");

//const Sequelize = require('sequelize');

require("dotenv").config();
//var mysql = require("mysql");
const mysql = require("mysql2");
const { NUsers } = require("../../models/n_users");
const { NUserprograms } = require("../../models/n_user_programs");
const mysql_promise = require("mysql2/promise");

const { Client } = require("../../models/client");
const { Napptreschedule } = require("../../models/n_appoint_reschedule");

const { NLogs } = require("../../models/n_logs");
const { parse } = require("path");
const { NprogramTypes } = require("../../models/n_program_type");
const { NUserProfile } = require("../../models/n_user_profile");
const { decode } = require("punycode");
const { Appointment } = require("../../models/appointment");
const { NDrugOrder } = require("../../models/n_drug_order");
const { NDrugDelivery } = require("../../models/n_drug_delivery");
const { NCourier } = require("../../models/n_courier");
const { masterFacility } = require("../../models/master_facility");
const { NBmi } = require("../../models/n_bmi");
const { NpatientObs } = require("../../models/n_patient_obs");
const { NReviews } = require("../../models/n_reviews");
const { NprogramOTP } = require("../../models/n_program_otp");
const { NToken } = require("../../models/n_revoke_token");

const { NChatLogs } = require("../../models/n_chat_log");
const { NFAQ } = require("../../models/n_faq");
const { NBmiLog } = require("../../models/n_bmi_log");
const { NBloodPressure } = require("../../models/n_blood_pressure");
const { NBloodSugar } = require("../../models/n_blood_sugar");
const { NMenstrual } = require("../../models/n_menstrual");
const { Nroles } = require("../../models/n_roles");
const { NProvider } = require("../../models/n_provider");
const { ScreeningForm } = require("../../models/n_cpm_screening");
const { CPMObservation } = require("../../models/n_cpm_observation");
const { CPMEncounter } = require("../../models/n_cpm_encounter");
const { CPMPrescription } = require("../../models/n_cpm_prescription");


generateOtp = function (size) {
	const zeros = "0".repeat(size - 1);
	const x = parseFloat("1" + zeros);
	const y = parseFloat("9" + zeros);
	const confirmationCode = String(Math.floor(x + Math.random() * y));
	return confirmationCode;
};

// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const fs = require("fs");
const serviceAccount = JSON.parse(
	fs.readFileSync("routes/serviceAccount.json", "utf8")
);

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

router.post("/signup", async (req, res) => {
	let phone = req.body.msisdn;
	let username = req.body.username;
	let email_address = req.body.email;
	let password_1 = req.body.password;
	let terms = req.body.termsAccepted;
	let f_name = req.body.f_name;
	let l_name = req.body.l_name;
	let dob = req.body.dob;
	let gender = req.body.gender;
	let today = moment(new Date().toDateString()).format("YYYY-MM-DD");
	let app_version = req.body.app_version;
	let fcm_token = req.body.fcm_token;

	// Check if Terms Are Accepted
	let boolVal;

	// Using the JSON.parse() method
	boolVal = JSON.parse(terms);
	if (boolVal !== true) {
		return res.status(200).json({
			success: false,
			msg: "Signup terms have not been accepted"
		});
	}

	// Check if Telephone Number Already Exists
	let check_user_phone = await NUsers.findOne({
		where: {
			msisdn: phone
		}
	});

	let refreshToken = crypto.randomBytes(64).toString("hex");

	if (check_user_phone) {
		return res.status(200).json({
			success: false,
			msg: "User with a similar phone number already exists"
		});
	}

	// Save Signup Details
	const password_hash = bcrypt.hashSync(password_1, 10);

	try {
		const new_user = await NUsers.create({
			msisdn: phone,
			username: username,
			password: password_hash,
			email: email_address,
			terms_accepted: true,
			is_active: "0",
			created_at: today,
			updated_at: today
		});

		// Log the new user details for debugging
		console.log("New User:", new_user);

		if (new_user) {
			const new_profile = await NUserProfile.create({
				f_name: f_name,
				l_name: l_name,
				email: email_address,
				phone_no: phone,
				user_id: new_user.id,
				dob: dob,
				gender: gender,
				created_at: today,
				updated_at: today
			});

			const log_login_attempt = await NUsers.update(
				{
					refresh_token: refreshToken,
					last_login: today,
					app_version: app_version,
					fcm_token: fcm_token
				},
				{ where: { id: new_user.id } }
			);

			if (new_profile) {
				const token = jwt.sign(
					{ userId: new_user.id, username: new_user.username },
					process.env.JWT_SECRET,
					{ expiresIn: "1h", jwtid: uuidv4() }
				);

				return res.status(200).json({
					success: true,
					msg: "Signup successfully",
					data: {
						token: token,
						refreshToken: refreshToken,
						user_id: base64.encode(new_user.id), // Use the decoded user ID
						phone_no: new_user.msisdn,
						account_verified: new_user.is_active
					}
				});
			} else {
				// Log the error for debugging
				console.error("Error creating user profile");
				return res.status(200).json({
					success: false,
					msg: "Error creating user profile"
				});
			}
		} else {
			// Log the error for debugging
			console.error("Error creating user");
			return res.status(200).json({
				success: false,
				msg: "Error creating user"
			});
		}
	} catch (error) {
		// Log any unexpected errors for debugging
		console.error("Unexpected error:", error);
		return res.status(500).json({
			success: false,
			msg: "An unexpected error occurred"
		});
	}
});

//Token Refresh
router.post("/refreshtoken", async (req, res) => {
	let refreshToken = req.body.token;
	let _user_id = req.body.user_id;

	try {
		console.log(_user_id);

		let user = NUsers.findOne({
			where: {
				id: base64.decode(_user_id),
				refresh_token: refreshToken
			}
		});

		if (!user) {
			return res.status(403).json({ message: "Invalid refresh token" });
		} else {
			let newToken = jwt.sign({ username: _user_id }, process.env.JWT_SECRET, {
				expiresIn: "3h"
			});

			let newRefreshToken = crypto.randomBytes(64).toString("hex");

			var l = {
				user_id: _user_id,
				token: newToken,
				refreshToken: newRefreshToken
			};

			let today = moment(new Date().toDateString()).format(
				"YYYY-MM-DD HH:mm:ss"
			);
			const log_login = await NUsers.update(
				{ last_login: today, refresh_token: newRefreshToken },
				{ where: { id: base64.decode(_user_id) } }
			);

			await NToken.create({
				token: refreshToken,
				user_id: base64.decode(_user_id)
			});

			return res.status(200).json({
				success: true,
				msg: "New access token generated",
				data: l
			});
		}
	} catch (err) {
		return res
			.status(400)
			.json({ msg: "Error Occurred While Generating Token" });
	}
});

//Token Revocation
router.post("/revoke_token", async (req, res) => {
	let refreshToken = req.body.token;
	let _user_id = req.body.user_id;

	let user = NUsers.findOne({
		where: {
			id: base64.decode(_user_id),
			refresh_token: refreshToken
		}
	});
	//onst user = users.find((u) => u.refreshToken === refreshToken);
	if (!user) {
		return res.status(400).json({ message: "Invalid refresh token" });
	}
	const log_login = await NUsers.update(
		{ refresh_token: null },
		{ where: { id: base64.decode(_user_id) } }
	);
	await NToken.create({
		token: refreshToken,
		user_id: base64.decode(_user_id)
	});
	var l = {
		user_id: _user_id
	};
	return res.status(200).json({
		success: true,
		msg: "Logout Successful",
		data: l
	});
});

//Sign-In Users
router.post("/signin", async (req, res) => {
	let vusername = req.body.user_name;
	let password_1 = req.body.password;
	let app_version = req.body.app_version;
	let fcm_token = req.body.fcm_token;
	let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

	//Check If User Exists
	//console.log(vusername);
	let check_username = await NUsers.findOne({
		where: {
			[Op.and]: [
				{
					[Op.or]: [{ msisdn: vusername }, { email: vusername }]
				}
			]
		}
	});

	let refreshToken = crypto.randomBytes(64).toString("hex");

	// check for if profile is up to date
	async function isProfileComplete(userId) {
		let userProfile = await NUserProfile.findOne({
			where: { user_id: userId }
		});

		if (!userProfile) return 0;

		const { f_name, l_name, gender, dob } = userProfile;
		if (!f_name || !l_name || !gender || !dob) {
			return 0;
		} else {
			return 1;
		}
	}

	//console.log(check_username.password);

	if (check_username) {
		let userId = check_username.id;
		let profile_complete = await isProfileComplete(userId);

		var password_hash = check_username.password;
		//console.log(password_hash);
		const verified = bcrypt.compareSync(password_1, password_hash);
		if (verified) {
			if (check_username.is_active === "0") {
				const token = jwt.sign(
					{ username: check_username.id },
					process.env.JWT_SECRET,
					{
						expiresIn: "1h",
						jwtid: uuidv4()
					}
				);

				const log_login_attempt = await NUsers.update(
					{ refresh_token: refreshToken },
					{ where: { id: check_username.id } }
				);
				//Log Login Date
				var l = {
					user_id: base64.encode(check_username.id),
					page_id: 0,
					token: token,
					refreshToken: refreshToken,
					phone_no: check_username.msisdn,
					account_verified: check_username.is_active,
					profile_complete: `${profile_complete}`
				};

				return res.status(200).json({
					success: false,
					msg: "Failed to sign-in, Your account is not verified kindly verify",
					data: l
				});
			} else if (check_username.is_active === "1") {
				//Log Activity
				var log_activity_ = NLogs.create({
					user_id: check_username.id,
					access: "LOGIN"
				});

				//Log Login Date
				var l = {
					user_id: base64.encode(check_username.id),
					page_id: 1
				};

				try {
					const log_login = await NUsers.update(
						{
							last_login: today,
							refresh_token: refreshToken,
							app_version: app_version,
							fcm_token: fcm_token
						},
						{ where: { id: check_username.id } }
					);
					const token = jwt.sign(
						{ username: check_username.id },
						process.env.JWT_SECRET,
						{
							expiresIn: "3h"
						}
					);
					// const refreshToken = crypto.randomBytes(64).toString("hex");
					// user.refreshToken = refreshToken;
					//Go to home page
					var l = {
						user_id: base64.encode(check_username.id),
						page_id: 1,
						token: token,
						refreshToken: refreshToken,
						phone_no: check_username.msisdn,
						account_verified: check_username.is_active,
						profile_complete: `${profile_complete}`
					};

					// Trigger data retrieval from getVLResults function
					// const hostURL = `${req.protocol}://${req.get("host")}`;

					// // Call VL Results Endpoint
					// const vlResultResponse = await axios.get(
					// 	`${hostURL}/nishauri_new/vl_results?user_id=${base64.encode(
					// 		check_username.id
					// 	)}`,
					// 	{
					// 		headers: {
					// 			Authorization: `Bearer ${token}`
					// 		}
					// 	}
					// );
					// const patientObservationsResponse = await axios.get(
					// 	`${hostURL}/nishauri_new/patient_clinic_new?user_id=${base64.encode(
					// 		check_username.id
					// 	)}`,
					// 	{
					// 		headers: {
					// 			Authorization: `Bearer ${token}`
					// 		}
					// 	}
					// );

					// // Convert the flattened programs array to JSON format
					// const patientObJSON = JSON.stringify(
					// 	patientObservationsResponse.data
					// );

					// console.log(patientObservationsResponse.data);

					// // Try to find the record
					// const [patientObsRecord, created] = await NpatientObs.findOrCreate({
					// 	where: { user_id: check_username.id },
					// 	defaults: {
					// 		user_id: check_username.id,
					// 		lab_data: vlResultResponse.data.msg,
					// 		patient_ob: patientObJSON
					// 	}
					// });

					// // If the record was found and not just created, update it
					// if (!created) {
					// 	await patientObsRecord.update({
					// 		lab_data: vlResultResponse.data.msg,
					// 		patient_ob: patientObJSON
					// 	});
					// }

					return res.status(200).json({
						success: true,
						msg: "Signin successfully",
						data: l
					});
				} catch (err) {
					console.log(err);
					return res.status(200).json({
						success: false,
						msg: "Failed to sign-in successfully",
						data: l
					});
				}
			}
		} else {
			return res.status(200).json({
				success: false,
				msg: "Wrong Password Provided"
			});
		}
	} else {
		return res.status(200).json({
			success: false,
			msg: " Username or phone number provided does not exist."
		});
	}
});

//Password Reset Users
router.post("/resetpassword", async (req, res) => {
	let vusername = req.body.user_name;
	// let password_1 = req.body.password;
	let today = moment(new Date().toDateString())
		.tz("Africa/Nairobi")
		.format("YYYY-MM-DD H:M:S");
	let vtoday = moment(new Date().toDateString())
		.tz("Africa/Nairobi")
		.format("H:M:S");

	//Check If User Exists
	//console.log(vusername);
	let check_username = await NUsers.findOne({
		where: {
			[Op.or]: [{ msisdn: vusername }, { email: vusername }]
		}
	});

	if (check_username) {
		//Generate OTP and send to Users Via Email or Telephone Number
		let vOTP = generateOtp(5);

		//Send SMS
		const header_details = {
			rejectUnauthorized: false,
			url: process.env.SMS_API_URL,
			method: "POST",
			json: true,
			headers: {
				Accept: "application/json",
				"api-token": process.env.SMS_API_KEY
			},

			body: {
				destination: check_username.msisdn,
				msg:
					"Dear Nishauri User, Your OTP for password reset is " +
					vOTP +
					". Valid for the next 24 hours.",
				sender_id: check_username.msisdn,
				gateway: process.env.SMS_SHORTCODE
			}
		};

		request.post(header_details, (err, res, body) => {
			if (err) {
				console.log(err);
				//Error Sending OTP
				return res.status(200).json({
					success: false,
					msg: "Error Sending OTP"
				});
			}
		});

		//Save OTP Details
		const log_OTP = await NUsers.update(
			{ otp_gen_date: today, otp_number: vOTP, otp_gen_hour: vtoday },
			{ where: { id: check_username.id } }
		);

		var l = {
			user_id: base64.encode(check_username.id),
			page_id: 3
		};

		//return success on OTP
		return res.status(200).json({
			success: true,
			msg: "OTP sent successfully",
			data: l
		});
	} else {
		return res.status(200).json({
			success: false,
			msg: "Invalid Email/Telephone Number Provided"
		});
	}
});

//Verify OTP Details
router.post("/verifyotp", async (req, res) => {
	let otp_verify = req.body.otp;
	let user_id = req.body.user_id;
	let today = moment(new Date().toDateString())
		.tz("Africa/Nairobi")
		.format("YYYY-MM-DD H:M:S");
	//Check If User Exists
	let check_username = await NUsers.findOne({
		where: {
			[Op.and]: [
				{ profile_otp_number: otp_verify },
				{ id: base64.decode(user_id) }
			]
		}
	});

	if (check_username) {
		var l = {
			user_id: base64.encode(check_username.id),
			page_id: 0
		};
		const active_user = await NUsers.update(
			{ is_active: "1" },
			{ where: { id: base64.decode(user_id) } }
		);
		//return success on OTP Verification
		return res.status(200).json({
			success: true,
			msg: "OTP Verified Successfully",
			data: l
		});
	} else {
		//return success on OTP Verification
		return res.status(200).json({
			success: false,
			msg: "Invalid or Expired OTP"
		});
	}
});

//Verify reset password otp
router.post("/verifyresetpassotp", async (req, res) => {
	let otp_verify = req.body.otp;
	let user_name = req.body.user_name;
	let today = moment(new Date().toDateString())
		.tz("Africa/Nairobi")
		.format("YYYY-MM-DD H:M:S");
	//Check If User Exists
	let check_username = await NUsers.findOne({
		where: {
			[Op.and]: [{ otp_number: otp_verify }, { msisdn: user_name }]
		}
	});

	if (check_username) {
		var l = {
			user_id: base64.encode(check_username.id),
			page_id: 0
		};

		//return success on OTP Verification
		return res.status(200).json({
			success: true,
			msg: "OTP Verified Successfully",
			data: l
		});
	} else {
		//return success on OTP Verification
		return res.status(200).json({
			success: false,
			msg: "Invalid or Expired OTP"
		});
	}
});

//update password
router.post(
	"/updatepassword",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let current_password = req.body.current_password;
		let new_password = req.body.new_password;
		let user_id = req.body.user_id;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		//Check if Passwords the current password is correct
		//const current_password_hash = bcrypt.hashSync(current_password, 10);
		const new_password_hash = bcrypt.hashSync(new_password, 10);
		try {
			const check_user = await NUsers.findOne({
				where: {
					id: base64.decode(user_id)
				}
			});
			if (check_user) {
				const check_password = await bcrypt.compare(
					current_password,
					check_user.password
				);
				if (check_password) {
					const log_login = await NUsers.update(
						{ password: new_password_hash },
						{ where: { id: base64.decode(user_id) } }
					);

					return res.status(200).json({
						success: true,
						msg: "Password reset successfully"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "Wrong current password provided"
					});
				}
			} else {
				return res.status(200).json({
					success: false,
					msg: "Failed to update new password"
				});
			}
		} catch (err) {
			return res.status(500).json({
				success: false,
				msg: "Server error could not update"
			});
		}
	}
);

// change password after reset
router.post("/changepassword", async (req, res) => {
	let password_1 = req.body.new_password;
	let user_name = req.body.user_name;
	let today = moment(new Date().toDateString())
		.tz("Africa/Nairobi")
		.format("YYYY-MM-DD H:M:S");

	const password_hash = bcrypt.hashSync(password_1, 10);

	try {
		const log_login = await NUsers.update(
			{ password: password_hash },
			{ where: { msisdn: user_name } }
		);
		if (log_login) {
			return res.status(200).json({
				success: true,
				msg: "Password reset successfully"
			});
		} else {
			return res.status(200).json({
				success: false,
				msg: "Failed to update new password"
			});
		}
	} catch (err) {
		console.error(error);
		return res.status(500).json({
			success: false,
			msg: "Internal server error"
		});
	}
});

//Set Programs
//app.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
//   res.send('You have accessed a protected route!');
//  });
router.get("/get_program", async (req, res) => {
	try {
		let programs = await NprogramTypes.findAll({
			where: {
				is_active: 1
			}
		});
		return res.status(200).json({
			success: true,
			message: "Programs were successfully retrieved",
			programs: programs
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to retrieve programs",
			error: error.message
		});
	}
});

// send otp to user
router.post(
	"/sendotp",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

		//Check If User Exists
		let check_username = await NUsers.findOne({
			where: {
				[Op.and]: [{ is_active: "0" }, { id: base64.decode(user_id) }]
			}
		});

		if (check_username) {
			//User Account Not Active- Show Page to Enter Program Indentification Details
			//Generate OTP
			//Generate OTP and send to Users Via Email or Telephone Number
			let vOTP = generateOtp(5);

			//Send SMS
			const header_details = {
				rejectUnauthorized: false,
				url: process.env.SMS_API_URL,
				method: "POST",
				json: true,
				headers: {
					Accept: "application/json",
					"api-token": process.env.SMS_API_KEY
				},

				body: {
					destination: check_username.msisdn,
					msg:
						"Dear Nishauri User, Your OTP to complete profile is " +
						vOTP +
						". Valid for the next 24 hours.",
					sender_id: check_username.msisdn,
					gateway: process.env.SMS_SHORTCODE
				}
			};

			request.post(header_details, (err, res, body) => {
				if (err) {
					console.log(err);
					//Error Sending OTP
					return res.status(200).json({
						success: false,
						msg: "Error Sending OTP"
					});
				}
			});

			//Save OTP Details
			const log_OTP = await NUsers.update(
				{ profile_otp_date: today, profile_otp_number: vOTP },
				{ where: { id: base64.decode(user_id) } }
			);

			var l = {
				user_id: base64.encode(check_username.id),
				phoneno: check_username.msisdn,
				otp: check_username.profile_otp_number
			};

			//Sent OTP Number
			return res.status(200).json({
				success: true,
				msg: "User OTP sent out successfully",
				data: l
			});
		} else {
			//Show Error Message
			return res.status(200).json({
				success: false,
				msg: "User doesnt exists"
			});
		}
	}
);

router.post(
	"/validate_program",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let ccc_no = req.body.ccc_no;
		let upi_no = req.body.upi_no;
		let firstname = req.body.firstname;
		let user_id = req.body.user_id;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		//Check if CCC is 10 digits
		if (ccc_no.length != 10) {
			return res.status(200).json({
				success: false,
				msg: `Invalid CCC Number: ${ccc_no}, The CCC must be 10 digits`
			});
		}

		//Check If User Exists
		let check_username = await NUsers.findOne({
			where: {
				[Op.and]: [{ is_active: "0" }, { id: base64.decode(user_id) }]
			}
		});

		//User Is Not Active
		//Validate Program In HIV
		let check_program_valid = await Client.findOne({
			where: {
				[Op.and]: [{ f_name: firstname }, { clinic_number: ccc_no }]
			}
		});

		if (!check_program_valid) {
			return res.status(200).json({
				success: false,
				msg: `Invalid CCC Number/ First Name Match: ${ccc_no}, The CCC Number/First Name does not match in Nishauri`
			});
		}

		if (check_username) {
			//User Account Not Active- Show Page to Enter Program Indentification Details
			//Generate OTP
			//Generate OTP and send to Users Via Email or Telephone Number
			let vOTP = generateOtp(5);

			//Send SMS
			const header_details = {
				rejectUnauthorized: false,
				url: process.env.SMS_API_URL,
				method: "POST",
				json: true,
				headers: {
					Accept: "application/json",
					"api-token": process.env.SMS_API_KEY
				},

				body: {
					destination: check_program_valid.phone_no,
					msg:
						"Dear Nishauri User, Your OTP to complete profile is " +
						vOTP +
						". Valid for the next 24 hours.",
					sender_id: check_program_valid.phone_no,
					gateway: process.env.SMS_SHORTCODE
				}
			};

			request.post(header_details, (err, res, body) => {
				if (err) {
					console.log(err);
					//Error Sending OTP
					return res.status(200).json({
						success: false,
						msg: "Error Sending OTP"
					});
				}
			});

			//Save OTP Details
			const log_OTP = await NUsers.update(
				{ profile_otp_date: today, profile_otp_number: vOTP },
				{ where: { id: base64.decode(user_id) } }
			);

			var l = {
				user_id: base64.encode(check_username.id),
				mohupi_: upi_no,
				cccno: ccc_no,
				firstname: firstname,
				phoneno: check_program_valid.phone_no
			};

			//Sent OTP Number
			return res.status(200).json({
				success: true,
				msg: "User OTP sent out successfully",
				data: l
			});
		} else {
			//Show Error Message
			return res.status(500).json({
				success: false,
				msg: "Program registration record already exists"
			});
		}
	}
);

//Set Programs
router.post(
	"/setprogram",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		//common body requests for all programs
		let program_id = req.body.program_id;
		let user_id = req.body.user_id;
		//	let otp = req.body.otp_number;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let programs = await NprogramTypes.findOne({
			where: {
				is_active: 1,
				id: program_id
			}
		});

		if (!programs) {
			return res.status(200).json({
				success: false,
				msg: "The program is not Active"
			});
		}

		//Check If User Exists
		let check_username = await NUserprograms.findOne({
			where: {
				[Op.and]: [{ id: base64.decode(user_id) }, { program_type: program_id }]
			}
		});
		// existing program
		let existing_other_program = await NUserprograms.findOne({
			where: {
				[Op.and]: [
					{ user_id: base64.decode(user_id) },
					{ is_active: 0 },
					{ program_type: program_id }
				]
			}
		});

		// Hiv program set up
		if (program_id === 1) {
			let ccc_no = req.body.ccc_no;
			let upi_no = req.body.upi_no;
			let firstname = req.body.firstname;
			let program_otp = req.body.program_otp;

			//Check if CCC is 10 digits
			if (ccc_no.length != 10) {
				return res.status(200).json({
					success: false,
					msg: `Invalid CCC Number: ${ccc_no}, The CCC must be 10 digits`
				});
			}
			// check if the otp is valid
			let check_otp = await NprogramOTP.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{ program_id: program_id },
						{ program_otp: program_otp }
					]
				}
			});

			if (!check_otp) {
				return res.status(200).json({
					success: false,
					msg: `Invalid OTP Provided`
				});
			}
			//Validate Program In HIV
			let check_program_valid = await Client.findOne({
				where: { clinic_number: ccc_no }
			});

			let check_program_new = await NUserprograms.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{ program_type: "1" } // ART program
					]
				}
			});

			if (!check_program_valid) {
				// if (
				// 	check_program_valid.f_name.toUpperCase() !== firstname.toUpperCase()
				// ) {
				return res.status(200).json({
					success: false,
					msg: `Invalid CCC Number: ${ccc_no}, The CCC Number does not match in Nishauri`
				});
				// }
			}

			let check_valid_user = await Client.findOne({
				where: {
					[Op.and]: [{ f_name: firstname }, { clinic_number: ccc_no }]
				}
			});

			if (!check_valid_user) {
				return res.status(200).json({
					success: false,
					msg: `The First Name does not match with CCC Number: ${ccc_no} in Nishauri`
				});
			}

			if (existing_other_program) {
				//Search if Program Details Exist
				let check_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ program_identifier: check_program_valid.id },
							{ user_id: base64.decode(user_id) },
							{ is_active: 1 },
							{ program_type: "1" } // ART program
						]
					}
				});
				let existing_other_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ user_id: base64.decode(user_id) },
							{ is_active: 0 },
							{ program_type: program_id }
						]
					}
				});
				let check_art_user = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ program_identifier: { [Op.ne]: check_program_valid.id } },
							{ user_id: base64.decode(user_id) },
							{ program_type: program_id }
						]
					}
				});

				if (check_art_user) {
					return res.status(200).json({
						success: false,
						msg: `The ART Program details does not belong to your records`
					});
				} else if (check_program) {
					return res.status(200).json({
						success: false,
						msg: "Program registration record already exists"
					});
				} else if (existing_other_program) {
					if (!check_program_valid) {
						return res.status(200).json({
							success: false,
							msg: `Invalid CCC Number: ${ccc_no}, The CCC Number does not match in Nishauri`
						});
					}
					if (!check_valid_user) {
						return res.status(200).json({
							success: false,
							msg: `The First Name does not match with CCC Number: ${ccc_no} in Nishauri `
						});
					}

					const update_program = await NUserprograms.update(
						{ is_active: "1", program_identifier: check_program_valid.id },
						{
							where: {
								[Op.and]: [
									{ user_id: base64.decode(user_id) },
									{ program_type: program_id }
								]
							}
						}
					);

					if (update_program) {
						return res.status(200).json({
							success: true,
							msg: "Program activation was Succesfully"
						});
					} else {
						return res.status(200).json({
							success: false,
							msg: "An error occurred, could not activate program record"
						});
					}
				}
			} else {
				let check_all_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ user_id: base64.decode(user_id) },
							{ is_active: 1 },
							{ program_type: program_id } // for other programs
						]
					}
				});
				if (check_all_program) {
					return res.status(200).json({
						success: true,
						msg: "Program registration record already exists."
					});
				} else {
					const new_user_program = await NUserprograms.create({
						user_id: base64.decode(user_id),
						program_type: "1",
						program_identifier: check_program_valid.id,
						moh_upi_no: upi_no,
						is_active: "1",
						activation_date: today,
						created_at: today,
						updated_at: today
					});

					if (new_user_program) {
						return res.status(200).json({
							success: true,
							msg: "Program registration was succesfully."
						});
					} else {
						return res.status(200).json({
							success: false,
							msg: "An error occurred, could not create program record"
						});
					}
				}
			}
		} else {
			// other programs set up

			let check_other_program = await NUserprograms.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{ is_active: 1 },
						{ program_type: program_id } // for other programs
					]
				}
			});

			if (check_other_program) {
				return res.status(200).json({
					success: true,
					msg: "Program registration record already exists."
				});
			} else if (existing_other_program) {
				const update_program = await NUserprograms.update(
					{ is_active: "1" },
					{
						where: {
							[Op.and]: [
								{ user_id: base64.decode(user_id) },
								{ program_type: program_id } // for other programs
							]
						}
					}
				);

				if (update_program) {
					return res.status(200).json({
						success: true,
						msg: "Program activation was Succesfully"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "An error occurred, could not activate program record"
					});
				}
			} else {
				//Save Program Details If Exist

				const new_user_program = await NUserprograms.create({
					user_id: base64.decode(user_id),
					program_type: program_id,
					is_active: "1",
					activation_date: today,
					created_at: today,
					updated_at: today
				});

				if (new_user_program) {
					return res.status(200).json({
						success: true,
						msg: "Program registration was succesfully"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "An error occurred, could not create program record"
					});
				}
			}
		}
	}
);

//update profile
router.post(
	"/setprofile",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.body.user_id;
			let f_name = req.body.f_name;
			let l_name = req.body.l_name;
			let phone_no = req.body.phone_no;
			let email = req.body.email;
			let dob = req.body.dob;
			let gender = req.body.gender;
			let landmark = req.body.landmark;
			let blood_group = req.body.blood_group;
			let weight = req.body.weight;
			let height = req.body.height;
			let marital = req.body.marital;
			let education = req.body.education;
			let primary_language = req.body.primary_language;
			let occupation = req.body.occupation;
			let allergies = req.body.allergies;
			let chronics = req.body.chronics;
			let disabilities = req.body.disabilities;
			let today = moment(new Date().toDateString())
				.tz("Africa/Nairobi")
				.format("YYYY-MM-DD H:M:S");

			let profile = await NUserProfile.findOne({
				where: {
					user_id: base64.decode(user_id)
				}
			});

			if (profile) {
				const user_profile = await NUserProfile.update(
					{
						f_name: f_name,
						l_name: l_name,
						dob: dob,
						phone_no: phone_no,
						email: email,
						gender: gender,
						landmark: landmark,
						blood_group: blood_group,
						weight: weight,
						height: height,
						marital: marital,
						education: education,
						primary_language: primary_language,
						occupation: occupation,
						allergies: allergies,
						chronics: chronics,
						disabilities: disabilities,
						updated_at: today
					},
					{
						where: {
							user_id: base64.decode(user_id)
						}
					}
				);

				if (user_profile) {
					return res.status(200).json({
						success: true,
						msg: "Your Profile was updated successfully",
						data: {
							user_id: user_id
						}
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "An error occurred, could not update profile"
					});
				}
			} else {
				// User doesn't exist, create a new profile
				const newProfile = await NUserProfile.create({
					user_id: base64.decode(user_id),
					f_name: f_name,
					l_name: l_name,
					dob: dob,
					phone_no: phone_no,
					email: email,
					gender: gender,
					landmark: landmark,
					blood_group: blood_group,
					weight: weight,
					height: height,
					marital: marital,
					education: education,
					primary_language: primary_language,
					occupation: occupation,
					allergies: allergies,
					chronics: chronics,
					disabilities: disabilities,
					created_at: today,
					updated_at: today
				});

				if (newProfile) {
					return res.status(200).json({
						success: true,
						msg: "Profile created successfully",
						data: {
							user_id: user_id
						}
					});
				} else {
					return res.status(500).json({
						success: false,
						msg: "An error occurred, could not create profile"
					});
				}
			}
		} catch (error) {
			// console.error(error);
			return res.status(500).json({
				success: false,
				msg: "Internal Server Error"
			});
		}
	}
);

// fetch profile
router.get(
	"/get_profile",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const user_id = req.query.user_id;

			const profile = await NUserProfile.findOne({
				where: {
					user_id: base64.decode(user_id)
				}
			});

			if (profile) {
				return res.status(200).json({
					success: true,
					message: "User profile retrieved successfully",
					data: {
						profile,
						user_id: user_id
					}
				});
			} else {
				return res.status(404).json({
					success: false,
					message: "User profile not found"
				});
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

//Fetch Home Details

router.get("/profile", async (req, res) => {
	const userid = req.query.user_id;
	//console.log(userid);

	try {
		const conn = mysql.createPool({
			connectionLimit: 10,
			host: process.env.DB_SERVER,
			port: process.env.DB_PORT,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			debug: true,
			multipleStatements: true
		});

		let sql = `CALL sp_nishauri_profile(?)`;
		let todo = [base64.decode(userid)];
		conn.query(sql, todo, (error, results, fields) => {
			if (error) {
				return console.error(error.message);
				conn.end();
			}
			// console.log(results);
			return res.status(200).json({
				success: true,
				data: results[0]
			});

			conn.end();
		});
	} catch (err) {}
});

//Fetch Home Upcoming Appointments
router.get(
	"/current_appt",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;
		//console.log(userid);

		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_nishauri_current_appt(?)`;
			let todo = [base64.decode(userid)];
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
					conn.end();
				}
				// console.log(results);
				//Log Activity
				var log_activity_ = NLogs.create({
					user_id: base64.decode(userid),
					access: "APPOINTMENTS"
				});
				return res.status(200).json({
					success: true,
					data: results[0]
				});

				conn.end();
			});
		} catch (err) {}
	}
);

//Fetch Appointment Trends
router.get(
	"/appointment_trends",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;
		//console.log(userid);

		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_nishauri_appointment_trend(?)`;
			let todo = [base64.decode(userid)];
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
					conn.end();
				}
				// console.log(results);
				var log_activity_ = NLogs.create({
					user_id: base64.decode(userid),
					access: "APPOINTMENTS_TRENDS"
				});

				return res.status(200).json({
					success: true,
					data: results[0]
				});

				conn.end();
			});
		} catch (err) {}
	}
);

//Missed Appointment by type

router.get(
	"/appointment_missed",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;
		//console.log(userid);

		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_nishauri_appt_missed(?)`;
			let todo = [base64.decode(userid)];
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
					conn.end();
				}
				// console.log(results);
				return res.status(200).json({
					success: true,
					data: results[0]
				});

				conn.end();
			});
		} catch (err) {}
	}
);

//previous appointment list
router.get("/appointment_previous", async (req, res) => {
	const userid = req.query.user_id;
	//console.log(userid);

	try {
		const conn = mysql.createPool({
			connectionLimit: 10,
			host: process.env.DB_SERVER,
			port: process.env.DB_PORT,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			debug: true,
			multipleStatements: true
		});

		let sql = `CALL sp_nishauri_history_appt(?)`;
		let todo = [base64.decode(userid)];
		conn.query(sql, todo, (error, results, fields) => {
			if (error) {
				return console.error(error.message);
				conn.end();
			}
			// console.log(results);
			return res.status(200).json({
				success: true,
				data: results[0]
			});

			conn.end();
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: "An error occurred while processing the request."
		});
	}
});

//previous appointment list
router.get("/appointment_future", async (req, res) => {
	const userid = req.query.user_id;
	//console.log(userid);

	try {
		const conn = mysql.createPool({
			connectionLimit: 10,
			host: process.env.DB_SERVER,
			port: process.env.DB_PORT,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			debug: true,
			multipleStatements: true
		});

		let sql = `CALL sp_nishauri_future_appt(?)`;
		let todo = [base64.decode(userid)];
		conn.query(sql, todo, (error, results, fields) => {
			if (error) {
				return console.error(error.message);
				conn.end();
			}
			// console.log(results);
			return res.status(200).json({
				success: true,
				data: results[0]
			});

			conn.end();
		});
	} catch (err) {}
});

//Reschedule Appointment
router.post(
	"/reschedule",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let app_id = req.body.appt_id;
		let reason_ = req.body.reason;
		let proposed_date_ = req.body.reschedule_date;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		//Check if we already have an existing reschedule request

		//Search if Program Details Exist
		let check_reschedule_request_exists = await Napptreschedule.findOne({
			where: {
				[Op.and]: [
					{ appointment_id: app_id },
					{ status: "0" } // Set 1 for HIV program
				]
			}
		});
		if (!check_reschedule_request_exists) {
			//Save Program Details If Exist
			const new_appt_request = await Napptreschedule.create({
				appointment_id: app_id,
				reason: reason_,
				request_date: today,
				proposed_date: proposed_date_,
				created_at: today,
				updated_at: today
			});

			if (new_appt_request) {
				return res.status(200).json({
					success: true,
					msg: "Reschedule request submitted successfully. "
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "An error occurred, could not create appointment reschedule request"
				});
			}
		} else {
			//Return Appointment Reschedule Already exist
			//Show Error Message
			return res.status(200).json({
				success: false,
				msg: "Appointment Reschedule Request Record Already Exist"
			});
		}
	}
);

//Fetch Regimen

router.get(
	"/vl_result",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;

		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");
		console.log(base64.decode(userid));

		//Check if we already have an existing reschedule request

		//Search if Program Details Exist
		let check_ccc_no = await NUserprograms.findOne({
			where: {
				[Op.and]: [
					{ user_id: base64.decode(userid) },
					{ program_type: "1" }, // Set 1 for HIV program
					{ is_active: "1" } // Set 1 for HIV program
				]
			}
		});
		// console.log(check_ccc_no);
		if (check_ccc_no) {
			//Get Client Details
			let check_program_valid = await Client.findOne({
				where: {
					id: check_ccc_no.program_identifier
				}
			});

			if (check_program_valid) {
				//Call mLab Instance
				client_payload =
					'{"ccc_number": "' + check_program_valid.clinic_number + '"}';
				// client_payload='{"ccc_number": "1409101178"}';
				const url_details = {
					url: process.env.MLAB_URL,
					json: true,
					body: JSON.parse(client_payload),
					rejectUnauthorized: false
				};

				request.post(url_details, (err, res_, body) => {
					if (err) {
						return console.log(err);
					}

					var obj_ = body;
					//obj.messege.sort

					//return console.log(obj_)
					if (
						obj_.message === "No results for the given CCC Number were found"
					) {
						var l = {
							viral_load: "Not Available"
						};
					} else {
						var obj2 = obj_.results;

						obj2.sort((a, b) => {
							return new Date(b.lab_order_date) - new Date(a.lab_order_date); // ascending
						});
						var sp_status = [];

						obj2.forEach((obj) => {
							Object.entries(obj).forEach(([key, value]) => {
								//Loop through the result set from mLab
								if (key == "result_content") {
									// console.log(`${value}`);
									var value_ = value;
									if (value_ == "") {
										// sp_status='';
									} else {
										if (value_.includes("LDL")) {
											sp_status.push("VS");
											//console.log(sp_status);
										} else {
											if (value_ < 200) {
												sp_status.push("VS");
											} else {
												sp_status.push("UVS");
											}
										}
									}
								}
							});
						});

						if (sp_status[0] == "VS") {
							var viral_load__ = "Virally Suppressed";
						} else {
							var viral_load__ = "Virally Unsuppressed";
						}

						var l = {
							viral_load: viral_load__
						};
					}
					var log_activity_ = NLogs.create({
						user_id: base64.decode(userid),
						access: "VL_RESULTS"
					});

					return res.status(200).json({
						success: true,
						msg: l
						//msg2: body,
					});
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "No Lab results records found"
				});
			}
		} else {
			return res.status(200).json({
				success: false,
				msg: "You've not enrolled to this program to view lab results"
			});
		}
	}
);

router.get(
	"/vl_results",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;

		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");
		console.log(base64.decode(userid));

		//Check if we already have an existing reschedule request

		//Search if Program Details Exist
		let check_ccc_no = await NUserprograms.findOne({
			where: {
				[Op.and]: [
					{ user_id: base64.decode(userid) },
					{ program_type: "1" }, // Set 1 for HIV program
					{ is_active: "1" } // Set 1 for HIV program
				]
			}
		});
		// console.log(check_ccc_no);
		if (check_ccc_no) {
			//Get Client Details
			let check_program_valid = await Client.findOne({
				where: {
					id: check_ccc_no.program_identifier
				}
			});

			if (check_program_valid) {
				//Call mLab Instance
				client_payload =
					'{"ccc_number": "' + check_program_valid.clinic_number + '"}';
				//client_payload='{"ccc_number": "1409101178"}';
				const url_details = {
					url: process.env.MLAB_URL,
					json: true,
					body: JSON.parse(client_payload),
					rejectUnauthorized: false
				};

				request.post(url_details, (err, res_, body) => {
					if (err) {
						return console.log(err);
					}

					var obj_ = body;
					var sp_status = [];

					//obj.messege.sort

					// return console.log(obj_)
					if (
						obj_.message ===
						"No lab results for the given CCC Number were found"
					) {
						sp_status.push("No lab records found");
					} else {
						var obj2 = obj_.results;

						obj2.sort((a, b) => {
							return new Date(b.date_collected) - new Date(a.date_collected); // ascending
						});

						obj2.forEach((obj) => {
							var lab_order_date_ = obj.date_collected;
							var result_type_ = obj.units;

							Object.entries(obj).forEach(([key, value]) => {
								//Loop through the result set from mLab

								if (key == "result_content") {
									// console.log(`${value}`);
									var value_ = value;
									if (value_ == "") {
										// sp_status='';
									} else {
										if (value_.includes("LDL")) {
											sp_status.push({
												result: "<LDL copies/ml",
												status: "Virally Suppressed",
												date: lab_order_date_,
												plot: parseInt(49)
											});
											//console.log(sp_status);
										} else {
											if (value_.replace(/[^0-9]/g, "") < 200) {
												sp_status.push({
													result: value_.replace(/[^0-9]/g, "") + " copies/ml",
													status: "Virally Suppressed",
													date: lab_order_date_,
													plot: parseInt(value_.replace(/[^0-9]/g, ""))
												});
											} else {
												sp_status.push({
													result: value_.replace(/[^0-9]/g, "") + " copies/ml",
													status: "Virally Unsuppressed",
													date: lab_order_date_,
													plot: parseInt(value_.replace(/[^0-9]/g, ""))
												});
											}
										}
									}
								}
							});
						});
					}
					var log_activity_ = NLogs.create({
						user_id: base64.decode(userid),
						access: "VL_RESULTS"
					});

					return res.status(200).json({
						success: true,
						msg: sp_status
						//msg2: body,
					});
				});
			} else {
				return res.status(500).json({
					success: false,
					msg: "No lab records found"
				});
			}
		} else {
			return res.status(200).json({
				success: false,
				msg: "You've not enrolled to this program to view lab results"
			});
		}
	}
);

//Function To Search EID Result

var eid_results_out = function (hei_no) {
	var return_variable = [];
	client_payload = '{"ccc_number": "1607320220018"}';

	// client_payload='{"ccc_number": "'+hei_no+'"}';

	const url_details = {
		url: process.env.MLAB_URL,
		json: true,
		body: JSON.parse(client_payload),
		rejectUnauthorized: false
	};
	var sp_status = [];

	request.post(url_details, (err, res_, body) => {
		if (err) {
			return console.log(err);
		}
		// return 'adasdad';

		//console.log(body.results);

		var obj_ = body;
		//console.log(obj_);

		// var sp_status=[];
		if (obj_.message === "No results for the given CCC Number were found") {
			// sp_status.push('No Results Found');
			sp_status = [];
		} else {
			//console.log(body.results);
			var obj2 = obj_.results;

			obj2.sort((a, b) => {
				return new Date(b.date_collected) - new Date(a.date_collected); // ascending
			});
			//  console.log(obj2);

			obj2.forEach((obj) => {
				var lab_order_date_ = obj.date_collected;
				var result_type_ = obj.result_type;
				//Loop through Objects

				Object.entries(obj).forEach(([key, value]) => {
					if (key == "result_content") {
						var value_ = value;
						if (value_ == "") {
							sp_status = [];
						} else {
							if (result_type_ == "2") {
								//Allow only for EID results
								sp_status.push({
									result: value_,
									result_type: "PCR Result",
									date: lab_order_date_
								});
							}
						}
					}
				});
			});

			console.log(sp_status);
			return_variable = sp_status;
		}

		//

		//dependants_.push({dependant_name:dependants[i].dependant_name,d_age:dependants[i].dependant_age,d_results:sp_status});
	});
	return return_variable;
};

router.get(
	"/eid_results",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;
		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_nishauri_dependants(?)`;
			let todo = [base64.decode(userid)];
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
					conn.end();
				}
				//Console Log
				//console.log(results[0]);
				dependants = results[0];
				//console.log(dependants);

				var dependants_ = [];

				for (var i in dependants) {
					//console.log(dependants[i].hei_no);
					//Loop Through EID Results
					var eidresults_ = [];
					eidresults_ = eid_results_out("jf");
					console.log(eidresults_);

					dependants_.push({
						dependant_name: dependants[i].dependant_name,
						d_age: dependants[i].dependant_age,
						d_results: eidresults_
					});
				}

				return res.status(200).json({
					success: true,
					data: dependants_
				});

				conn.end();
			});
		} catch (err) {}
	}
);

//Fetch Regimen
router.get("/regimen", async (req, res) => {
	const userid = req.query.user_id;

	let today = moment(new Date().toDateString())
		.tz("Africa/Nairobi")
		.format("YYYY-MM-DD H:M:S");
	console.log(base64.decode(userid));

	//Check if we already have an existing reschedule request

	//Search if Program Details Exist
	let check_ccc_no = await NUserprograms.findOne({
		where: {
			[Op.and]: [
				{ user_id: base64.decode(userid) },
				{ program_type: "1" }, // Set 1 for HIV program
				{ is_active: "1" } // Set 1 for HIV program
			]
		}
	});
	// console.log(check_ccc_no);
	if (check_ccc_no) {
		//Get Client Details
		let check_program_valid = await Client.findOne({
			where: {
				id: check_ccc_no.program_identifier
			}
		});

		if (check_program_valid) {
			//Call mLab Instance
			// client_payload='{"ccc_number": "'+check_program_valid.clinic_number+'"}';
			// http://prod.kenyahmis.org:8002/api/patient/1234567890/regimen
			//request.get(process.env.ART_URL+'1234567890/regimen', (err, res_, body) => {

			request.get(
				process.env.ART_URL +
					"patient/" +
					check_program_valid.clinic_number +
					"/regimen",
				(err, res_, body) => {
					if (err) {
						return console.log(err);
					}
					// res_.send(err);
					// return console.log(body)
					var obj = JSON.parse(body);
					return res.status(200).json({
						success: true,
						msg: obj.message
					});
				}
			);
		} else {
			return res.status(200).json({
				success: false,
				msg: "No Regimen records found, you are not registered to this program"
			});
		}
	} else {
		return res.status(200).json({
			success: false,
			msg: "No Regimen records found, you are not registered to this programr"
		});
	}
});

//Fetch Facility directory

router.get(
	"/artdirectory",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const facility = req.query.name;
			const isCode = /^\d{5}$/.test(facility);
			const userid = req.query.user_id;

			let today = moment(new Date().toDateString())
				.tz("Africa/Nairobi")
				.format("YYYY-MM-DD H:M:S");

			// Log user activity
			var log_activity_ = NLogs.create({
				user_id: base64.decode(userid),
				access: "ARTDIRECTORY"
			});

			let apiUrl;
			if (isCode) {
				apiUrl = `${process.env.ART_URL}facility/directory?code=${facility}`;
			} else {
				apiUrl = `${process.env.ART_URL}facility/directory?name=${facility}`;
			}

			request.get(
				{
					url: apiUrl
				},
				(error, response, body) => {
					if (error) {
						console.error(error);
						return res.status(500).json({
							success: false,
							message: "Error occurred while searching facility directory."
						});
					}

					if (response.statusCode !== 200) {
						return res.status(response.statusCode).json({
							success: false,
							message: "Error occurred while searching facility directory."
						});
					}

					var obj = JSON.parse(body);
					return res.status(200).json({
						success: true,
						message: obj.message,
						data: obj.data
					});
				}
			);
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

//Fetch Dependants

router.get(
	"/dependants",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const userid = req.query.user_id;
		//console.log(userid);

		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_nishauri_dependants(?)`;
			let todo = [base64.decode(userid)];
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
					conn.end();
				}
				// console.log(results);
				return res.status(200).json({
					success: true,
					data: results[0]
				});

				conn.end();
			});
		} catch (err) {}
	}
);

//Fetch Dependants

router.post("/bmi_calculator", async (req, res) => {
	heigh = parseFloat(req.body.height);
	weigh = parseFloat(req.body.weight);
	const userid = req.body.user_id;

	//bmi = weigh / (heigh * heigh);

	//number to string format

	// bmi = weigh/(heigh*heigh)
	//if (heigh<=3){
	//    weigh=weigh
	//  } else if (heigh>3 && heigh<10){
	//    heigh=(heigh/3.281)
	//  } else{
	//    heigh=(heigh/100)
	//  }
	bmi = weigh / ((heigh * heigh) / 10000);
	bmi = bmi.toFixed(2);
	//bmi = bmi.toFixed();

	//req_name = req.body.Name;

	// CONDITION FOR BMI
	if (bmi < 18.5) {
		var l = {
			bmi: bmi,
			comment: "Underweight"
		};
	} else if (18.5 <= bmi && bmi < 25) {
		var l = {
			bmi: bmi,
			comment: "Normalweight"
		};
	} else if (25 <= bmi && bmi < 30) {
		var l = {
			bmi: bmi,
			comment: "Overweight"
		};
	} else {
		var l = {
			bmi: bmi,
			comment: "Obese"
		};
	}

	var log_activity_ = NLogs.create({
		user_id: base64.decode(userid),
		access: "BMICALCULATOR"
	});

	return res.status(200).json({
		success: true,
		msg: l
	});
});

router.post(
	"/chat",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const question_ = req.body.question;
		const userid = req.body.user_id;

		//client_payload='{"question": "hello"}';

		const url_details = {
			url: process.env.CHAT_URL + "chatbot",
			//  json: true,
			form: { question: question_ },
			rejectUnauthorized: false
		};
		request.post(url_details, (err, res_, body) => {
			if (err) {
				return console.log(err);
			}
			//var obj_ = body;
			//console.log(body);

			var log_activity_ = NLogs.create({
				user_id: base64.decode(userid),
				access: "CHAT"
			});

			var obj = JSON.parse(body);

			var log_chat = NChatLogs.create({
				user_id: base64.decode(userid),
				quiz: question_,
				response: obj.response
			});

			return res.status(200).json({
				success: true,
				msg: obj.response,
				question: question_
			});
			//var sp_status=[];
		});
	}
);

//Fetch  Appointment From CCC Number
router.get(
	"/appointments",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const ccc_no = req.query.ccc_no;
		//console.log(userid);

		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_dawa_drop_appt(?)`;
			let todo = [ccc_no];
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
					conn.end();
				}
				// console.log(results);
				//Log Activity
				// var log_activity_=NLogs.create({ user_id:base64.decode(userid), access:'APPOINTMENTS'});
				return res.status(200).json({
					success: true,
					data: results[0]
				});

				conn.end();
			});
		} catch (err) {}
	}
);

///Client Survey
//Manages Access to client Survey endpoints
function getAccessToken(url, callback) {
	var token = "";
	auth_payload =
		'{"msisdn": "' +
		process.env.PSURVEY_USER +
		'", "password": "' +
		process.env.PSURVEY_PASSWORD +
		'"}';
	const url_details = {
		url: process.env.PSURVEY_URL + "auth/token/login",
		json: true,
		body: JSON.parse(auth_payload)
	};
	request.post(url_details, function (err, httpResponse, body) {
		//return token=httpResponse.body;

		//console.log(httpResponse);
		var statusCode = httpResponse.statusCode;
		finalData = httpResponse.body;

		callback(finalData);
		// we are done
		return;
	});
}

router.post(
	"/getactive_q_list",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		//Get Passed Values
		const userid = req.body.user_id;

		//Get Token
		var token_generated_ = "";
		var verified_data = "";
		var check_program_valid = "";
		let check_ccc_no = await NUserprograms.findOne({
			where: {
				[Op.and]: [
					{ user_id: base64.decode(userid) },
					{ program_type: "1" }, // Set 1 for HIV program
					{ is_active: "1" } // Set 1 for HIV program
				]
			}
		});
		// console.log(check_ccc_no);
		if (check_ccc_no) {
			//Get Client Details
			check_program_valid = await Client.findOne({
				where: {
					id: check_ccc_no.program_identifier
				}
			});
		}

		getAccessToken("url_invalid", function (token_generated) {
			//Parse Token
			// console.log(token_generated);
			// parsedBody= JSON.parse(token_generated);
			token_generated_ = token_generated.auth_token;
			// console.log(token_generated_);
			//Call Active Surveys Endpoints
			request.get(
				process.env.PSURVEY_URL +
					"api/current/user/" +
					check_program_valid.mfl_code +
					"/" +
					check_program_valid.clinic_number,
				{
					headers: {
						Authorization: "Token " + token_generated_
					}
				},
				function (err, respond) {
					console.log(token_generated_);

					//console.log(respond);
					//console.log(verified_data);
					if (res.statusCode == 400) {
						res.send(respond);
					} else if (res.statusCode == 200) {
						verified_data = JSON.parse(respond.body);
						res.send(verified_data);
					} else if (res.statusCode == 500) {
						res.send(respond);
					} else if (res.statusCode == 401) {
						res.send(respond);
					}
					//res.send(respond);
				}
			);
		});
	}
);

router.post("/getactive_q", async (req, res) => {
	//Get Passed Values
	const userid = req.body.user_id;

	//Get Token
	var token_generated_ = "";
	var verified_data = "";
	var check_program_valid = "";
	let check_ccc_no = await NUserprograms.findOne({
		where: {
			[Op.and]: [
				{ user_id: base64.decode(userid) },
				{ program_type: "1" }, // Set 1 for HIV program
				{ is_active: "1" } // Set 1 for HIV program
			]
		}
	});
	// console.log(check_ccc_no);
	if (check_ccc_no) {
		//Get Client Details
		check_program_valid = await Client.findOne({
			where: {
				id: check_ccc_no.program_identifier
			}
		});
	}

	getAccessToken("url_invalid", function (token_generated) {
		//Parse Token
		//console.log(token_generated);
		// parsedBody= JSON.parse(token_generated);
		token_generated_ = token_generated.auth_token;
		// console.log(token_generated_);
		//Call Active Questionnaire Endpoint
		request.get(
			process.env.PSURVEY_URL +
				"api/questionnaire/active/" +
				check_program_valid.mfl_code +
				"/" +
				check_program_valid.clinic_number,
			{
				headers: {
					Authorization: "Token " + token_generated_
				}
			},
			function (err, respond) {
				// console.log(token_generated_);

				//console.log(respond);
				//console.log(verified_data);
				if (res.statusCode == 400) {
					res.send(respond);
				} else if (res.statusCode == 200) {
					verified_data = JSON.parse(respond.body);
					res.send(verified_data);
				} else if (res.statusCode == 500) {
					res.send(respond);
				} else if (res.statusCode == 401) {
					res.send(respond);
				}
				//res.send(respond);
			}
		);
	});
});

router.post(
	"/start_q",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		//Get Passed Values
		const userid = req.body.user_id;
		const questionnaire_id_ = req.body.questionnaire_id;
		const ccc_number_ = req.body.ccc_number;
		const first_name_ = req.body.first_name;
		const questionnaire_participant_id_ = req.body.questionnaire_participant_id;
		const interviewer_statement_ = req.body.interviewer_statement;
		const informed_consent_ = req.body.informed_consent;
		const privacy_policy_ = req.body.privacy_policy;

		post_payload =
			'{"questionnaire_id": "' +
			questionnaire_id_ +
			'", "ccc_number": "' +
			ccc_number_ +
			'", "first_name": "' +
			first_name_ +
			'", "questionnaire_participant_id": "' +
			questionnaire_participant_id_ +
			'", "interviewer_statement": "' +
			interviewer_statement_ +
			'",' +
			'"informed_consent": "' +
			informed_consent_ +
			'", "privacy_policy": "' +
			privacy_policy_ +
			'"}';

		//Get Token
		var token_generated_ = "";
		var verified_data = "";

		getAccessToken("url_invalid", function (token_generated) {
			//Parse Token
			//console.log(token_generated);
			// parsedBody= JSON.parse(token_generated);
			token_generated_ = token_generated.auth_token;

			const url_details = {
				url: process.env.PSURVEY_URL + "api/questionnaire/start/",
				json: true,
				body: JSON.parse(post_payload),
				headers: {
					Authorization: "Token " + token_generated_
				}
			};

			request.post(url_details, (err, res, body) => {
				if (err) {
					return console.log(err);
				}
				// console.log(res.body)
				if (res.statusCode == 400) {
					res_.send(body);
				} else if (res.statusCode == 200) {
					//const body_ = JSON.parse(body);

					//var link=body_[0]['link'];
					//var session=body_[0]['session'];
					//let json = JSON.parse(body);

					// console.log(body.link);
					const urlParts = body.link.split("/");
					const q_id = urlParts[urlParts.length - 1];

					let return_ = {
						link: parseInt(q_id),
						session: body.session
					};

					res_.send(return_);
				} else if (res.statusCode == 500) {
					res_.send(body);
				} else if (res.statusCode == 401) {
					res_.send(body);
				}
				// res_.send(body);
			});
		});
	}
);

router.post("/next_q", async (req, res) => {
	//Get Passed Values
	const userid = req.body.user_id;
	const next_q_ = req.body.next_q;
	const session_ = req.body.session;
	//const question_ = req.body.question;
	//const answer_ = req.body.answer;
	//const open_text_ = req.body.open_text;

	//Get Token
	var token_generated_ = "";
	var verified_data = "";

	getAccessToken("url_invalid", function (token_generated) {
		//Parse Token
		//console.log(token_generated);
		// parsedBody= JSON.parse(token_generated);
		token_generated_ = token_generated.auth_token;
		// console.log(token_generated_);
		//Call Session ID Endpoint
		request.get(
			process.env.PSURVEY_URL +
				"api/questions/answer/" +
				next_q_ +
				"/" +
				session_,
			{
				headers: {
					Authorization: "Token " + token_generated_
				}
			},
			function (err, respond) {
				// console.log(token_generated_);

				//console.log(respond);
				//console.log(verified_data);
				if (res.statusCode == 400) {
					res.send(respond);
				} else if (res.statusCode == 200) {
					console.log(respond.body);
					verified_data = JSON.parse(respond.body);
					res.send(verified_data);
				} else if (res.statusCode == 500) {
					res.send(respond);
				} else if (res.statusCode == 401) {
					res.send(respond);
				}
				//res.send(respond);
			}
		);
	});
});

router.post(
	"/q_answer",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		//Get Passed Values
		console.log(req.body.session);

		const userid = req.body.user_id;
		const session_ = req.body.session;
		const question_ = req.body.question;
		const answer_ = req.body.answer;
		const open_text_ = req.body.open_text;

		post_payload =
			'{"session": "' +
			session_ +
			'", "question": "' +
			question_ +
			'", "answer": "' +
			answer_ +
			'", "open_text": "' +
			open_text_ +
			'"}';
		console.log(post_payload);

		//Get Token
		var token_generated_ = "";
		var verified_data = "";

		getAccessToken("url_invalid", function (token_generated) {
			//Parse Token
			//console.log(token_generated);
			// parsedBody= JSON.parse(token_generated);
			token_generated_ = token_generated.auth_token;

			const url_details = {
				url: process.env.PSURVEY_URL + "api/questions/answer/",
				json: true,
				body: JSON.parse(post_payload),
				headers: {
					Authorization: "Token " + token_generated_
				}
			};

			request.post(url_details, (err, res_, body) => {
				if (err) {
					return console.log(err);
				}
				// console.log(res.body)
				if (res_.statusCode == 400) {
					res.send(body);
				} else if (res_.statusCode == 200) {
					// var link=body[0]['link'];
					// var session=body[0][''];
					// console.log(body);

					if (typeof body.link == "undefined") {
						// Assign value to the property here
						//Obj.property = someValue;
						res.send(body);
					} else {
						const urlParts = body.link.split("/");
						// console.log(urlParts);
						const q_id = urlParts[urlParts.length - 1];
						const urlParts_pr = body.prevlink.split("/");
						const q_id_pr = urlParts_pr[urlParts_pr.length - 2];

						let return_ = {
							prevlink: parseInt(q_id_pr),
							link: parseInt(q_id),
							session: parseInt(session_)
						};

						res.send(return_);
					}

					//res_.send(body);
				} else if (res_.statusCode == 500) {
					res.send(body);
				} else if (res_.statusCode == 401) {
					res.send(body);
				}
				// res_.send(body);
			});
		});
	}
);

// create order request
router.post(
	"/create_order",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.body.user_id;
			let ccc_no = req.body.ccc_no;
			let appointment_id = req.body.appointment_id;
			let order_type = req.body.order_type;
			let delivery_address = req.body.delivery_address;
			let delivery_method = req.body.delivery_method;
			let mode = req.body.mode;
			let delivery_pickup_time = req.body.delivery_pickup_time;
			let client_phone_no = req.body.client_phone_no;
			let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

			let check_order_request = await NDrugOrder.findOne({
				where: {
					appointment_id: appointment_id
				}
			});

			let check_patient = await Client.findOne({
				where: {
					clinic_number: ccc_no
				}
			});

			if (check_order_request) {
				return res.status(200).json({
					success: false,
					msg: "You already have an active drug delivery request for this appointment"
				});
			} else {
				if (delivery_method === "In Person") {
					let delivery_person = req.body.delivery_person;
					let delivery_person_id = req.body.delivery_person_id;
					let delivery_person_contact = req.body.delivery_person_contact;
					const new_order = await NDrugOrder.create({
						program_identifier: check_patient.id,
						appointment_id: appointment_id,
						order_type: order_type,
						delivery_address: delivery_address,
						delivery_method: delivery_method,
						// courier_service: courier_service,
						delivery_person: delivery_person,
						delivery_person_id: delivery_person_id,
						delivery_person_contact: delivery_person_contact,
						mode: mode,
						order_by: base64.decode(user_id),
						client_phone_no: client_phone_no,
						delivery_pickup_time: delivery_pickup_time,
						status: "Pending",
						is_received: 0,
						created_at: today,
						updated_at: today
					});
					var log_activity_ = NLogs.create({
						user_id: base64.decode(user_id),
						access: "DAWADROP"
					});
					if (new_order) {
						return res.status(200).json({
							success: true,
							msg: "Order request made succesfully"
						});
					} else {
						return res.status(200).json({
							success: false,
							msg: "An error occurred, could not create delivery request"
						});
					}
				} else {
					let courier_service = req.body.courier_service;
					const new_order = await NDrugOrder.create({
						program_identifier: check_patient.id,
						appointment_id: appointment_id,
						order_type: order_type,
						delivery_address: delivery_address,
						delivery_method: delivery_method,
						courier_service: courier_service,
						mode: mode,
						order_by: base64.decode(user_id),
						client_phone_no: client_phone_no,
						delivery_pickup_time: delivery_pickup_time,
						status: "Pending",
						is_received: 0,
						created_at: today,
						updated_at: today
					});
					var log_activity_ = NLogs.create({
						user_id: base64.decode(user_id),
						access: "DAWADROP"
					});
					if (new_order) {
						return res.status(200).json({
							success: true,
							msg: "Order request made succesfully"
						});
					} else {
						return res.status(200).json({
							success: false,
							msg: "An error occurred, could not create delivery request"
						});
					}
				}
			}
		} catch (error) {
			return res.status(500).json({
				success: false,
				msg: "Internal Server Error"
			});
		}
	}
);

// get client details for order
router.get(
	"/upcoming_appointment",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.query.user_id;

		let check_patient_program = await NUserprograms.findOne({
			where: {
				user_id: base64.decode(user_id),
				program_type: 1
			}
		});
		if (!check_patient_program) {
			return res.status(200).json({
				success: false,
				msg: "You are not registered in this program"
			});
		}

		let check_patient = await Client.findOne({
			where: {
				id: check_patient_program.program_identifier
			}
		});

		try {
			const conn = mysql.createPool({
				connectionLimit: 10,
				host: process.env.DB_SERVER,
				port: process.env.DB_PORT,
				user: process.env.DB_USER,
				password: process.env.DB_PASSWORD,
				database: process.env.DB_NAME,
				debug: true,
				multipleStatements: true
			});

			let sql = `CALL sp_dawa_drop_appt(?)`;
			let todo = base64.decode(user_id);
			conn.query(sql, todo, (error, results, fields) => {
				if (error) {
					return console.error(error.message);
				}
				if (results[0].length === 0) {
					return res.status(200).json({
						success: false,
						msg: "You do not have upcoming appointment"
					});
				} else {
					// Log Activity
					// var log_activity_ = NLogs.create({ user_id: base64.decode(userid), access: 'APPOINTMENTS'});
					return res.status(200).json({
						success: true,
						msg: "You have upcoming appointments",
						data: results[0]
					});
				}

				conn.end();
			});
		} catch (err) {
			return res.status(500).json({
				success: false,
				msg: "Internal Server Error"
			});
		}
	}
);

// get courier services
router.get(
	"/courier_services",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let courier = await NCourier.findAll({
				where: {
					is_active: 1
				}
			});
			return res.status(200).json({
				success: true,
				message: "Couriers Found",
				data: courier
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Failed to retrieve courier",
				error: error.message
			});
		}
	}
);

// get user programs
router.get(
	"/user_programs",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.query.user_id;

		let check_patient_program = await NUserprograms.findOne({
			where: {
				user_id: base64.decode(user_id)
			}
		});
		if (!check_patient_program) {
			return res.status(200).json({
				success: false,
				msg: "User not found"
			});
		} else {
			try {
				const conn = mysql.createPool({
					connectionLimit: 10,
					host: process.env.DB_SERVER,
					port: process.env.DB_PORT,
					user: process.env.DB_USER,
					password: process.env.DB_PASSWORD,
					database: process.env.DB_NAME,
					debug: true,
					multipleStatements: true
				});

				let sql = `CALL sp_nishauri_user_programs(?)`;
				let todo = [base64.decode(user_id)];
				conn.query(sql, todo, (error, results, fields) => {
					if (results[0].length === 0) {
						return res.status(200).json({
							success: false,
							msg: "No programs found"
						});
					} else {
						return res.status(200).json({
							success: true,
							msg: "User programs successfully found",
							user_id: user_id,
							programs: results[0]
						});
					}

					conn.end();
				});
			} catch (err) {
				return res.status(500).json({
					success: false,
					msg: "Internal Server Error"
				});
			}
		}
	}
);

// get drug delivery requests
router.get(
	"/drug_delivery_list",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.query.user_id;

		let check_patient = await NDrugOrder.findOne({
			where: {
				order_by: base64.decode(user_id)
			}
		});
		if (!check_patient) {
			return res.status(200).json({
				success: false,
				msg: "No drug delivery request found"
			});
		} else {
			try {
				const conn = mysql.createPool({
					connectionLimit: 10,
					host: process.env.DB_SERVER,
					port: process.env.DB_PORT,
					user: process.env.DB_USER,
					password: process.env.DB_PASSWORD,
					database: process.env.DB_NAME,
					debug: true,
					multipleStatements: true
				});

				let sql = `CALL sp_nishauri_drug_delivery(?)`;
				let todo = [base64.decode(user_id)];
				conn.query(sql, todo, (error, results, fields) => {
					if (results[0].length === 0) {
						return res.status(200).json({
							success: false,
							msg: "No drug delivery request found"
						});
					} else {
						return res.status(200).json({
							success: true,
							msg: "Drug delivery request successfully found",
							user_id: user_id,
							programs: results[0]
						});
					}

					conn.end();
				});
			} catch (err) {
				return res.status(500).json({
					success: false,
					msg: "Internal Server Error"
				});
			}
		}
	}
);
// confirmation receipt
router.post(
	"/delivery_confirmation",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.body.user_id;
			let confirmation_code = req.body.confirmation_code;
			let is_received = req.body.is_received;
			let order_id = req.body.order_id;
			let comment = req.body.comment;
			let today = moment(new Date().toDateString())
				.tz("Africa/Nairobi")
				.format("YYYY-MM-DD H:M:S");

			let check_order = await NDrugOrder.findOne({
				where: {
					id: order_id,
					status: "Dispatched"
				}
			});

			if (check_order) {
				const confirm_receipt = await NDrugOrder.update(
					{
						is_received: is_received,
						status: "Fullfilled",
						comment: comment,
						fullfilled_date: today,
						updated_at: today
					},
					{
						where: {
							confirmation_code: confirmation_code
						}
					}
				);
				if (confirm_receipt) {
					return res.status(200).json({
						success: true,
						msg: `Drug delivery request Order No: ${confirmation_code} confirmed succesfully`
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "An error occurred, could not confirmed"
					});
				}
			} else {
				return res.status(200).json({
					success: false,
					msg: "Invalid Confirmation code"
				});
			}
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

// router.get(
// 	"/patient_clinic",
// 	passport.authenticate("jwt", { session: false }),
// 	async (req, res) => {
// 		const userid = req.query.user_id;

// 		const decodedUserid = base64.decode(userid);

// 		try {
// 			// Fetch all active programs for the user
// 			const userPrograms = await NUserprograms.findAll({
// 				where: {
// 					user_id: decodedUserid,
// 					is_active: 1
// 				}
// 			});

// 			const finalJson = {
// 				programs: []
// 			};

// 			// Loop through each active program
// 			for (const program of userPrograms) {
// 				const { program_type } = program;

// 				// Get program details by program_type
// 				const programDetails = await NprogramTypes.findOne({
// 					where: { id: program_type }
// 				});

// 				if (programDetails) {
// 					const { name } = programDetails;

// 					const clientDetails = await Client.findOne({
// 						where: { id: program.program_identifier }
// 					});
// 					let patientFacility = await masterFacility.findOne({
// 						where: {
// 							code: clientDetails.mfl_code
// 						},
// 						attributes: ["code", "name"]
// 					});

// 					if (clientDetails) {
// 						const url = `${process.env.ART_URL}patient/${clientDetails.clinic_number}/regimen`;

// 						// Make request to fetch program-specific data
// 						request.get(url, (err, res_, body) => {

// 							let programData;
// 							if (err) {
// 								console.error("Error making request:", err);
// 								return;
// 							}
// 							try {
// 								programData = JSON.parse(body);
// 							} catch (parseError) {
// 								return;
// 							}
// 							// Assuming programData.message is an array
// 							if (
// 								programData.status === "success" &&
// 								Array.isArray(programData.message) &&
// 								programData.message.length > 0
// 							) {
// 								// Extract the first element from programData.message
// 								const programItem = programData.message[0];

// 								// Add program data to final JSON response
// 								finalJson.programs.push({
// 									name,
// 									facility: patientFacility.name,
// 									patient_observations: programItem
// 								});

// 								// If this is the last program, send the final JSON response
// 								if (finalJson.programs.length === userPrograms.length) {
// 									return res.status(200).json(finalJson);
// 								}
// 							} else {
// 								console.error("Unexpected program data format:", programData);
// 							}
// 						});
// 					} else {
// 						console.error("Client details not found for program:", program);
// 					}
// 				} else {
// 					console.error("Program details not found for program:", program);
// 				}
// 			}
// 		} catch (error) {
// 			return res.status(500).json({
// 				success: false,
// 				msg: "Error occurred while fetching data"
// 			});
// 		}
// 	}
// );
async function getVLResults(baseURL, userID, authToken) {
	return new Promise((resolve, reject) => {
		const url = `${baseURL}/nishauri_new/vl_results?user_id=${userID}`;
		const options = {
			url,
			headers: {
				Authorization: `Bearer ${authToken}`
			}
		};

		request.get(options, (err, res_, body) => {
			if (err) {
				reject(err);
				return;
			}
			// Try to parse the body as JSON
			let vlResults;
			try {
				vlResults = JSON.parse(body);
			} catch (parseError) {
				reject(parseError);
				return;
			}

			// Check if the payload contains the "msg" array
			if (
				!vlResults.msg ||
				!Array.isArray(vlResults.msg) ||
				vlResults.msg.length === 0
			) {
				reject("Invalid payload format");
				return;
			}

			// Sort results by date in descending order
			vlResults.msg.sort((a, b) => new Date(b.date) - new Date(a.date));

			// Take the result for the latest date
			const latestResult = vlResults.msg[0];
			resolve(latestResult);
		});
	});
}

router.get(
	"/patient_clinic",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;
			let decodedUserid = base64.decode(user_id);
			let authToken = req.header("Authorization").replace("Bearer ", "");

			let userPrograms = await NUserprograms.findAll({
				where: {
					user_id: decodedUserid,
					is_active: 1
				}
			});

			const finalJson = {
				programs: []
			};

			const promises = [];

			for (const program of userPrograms) {
				const { program_type, program_identifier } = program;

				const programDetails = await NprogramTypes.findOne({
					where: { id: program_type }
				});

				if (!programDetails) {
					continue;
				}

				const { name } = programDetails;

				const clientDetails = await Client.findOne({
					where: { id: program_identifier }
				});

				let patientFacility = null;
				if (clientDetails) {
					const { mfl_code } = clientDetails;

					patientFacility = await masterFacility.findOne({
						where: {
							code: mfl_code
						},
						attributes: ["code", "name"]
					});
				}

				const facilityName = patientFacility ? patientFacility.name : null;

				const regimenUrl = clientDetails
					? `${process.env.ART_URL}patient/${clientDetails.clinic_number}/regimen`
					: null;

				promises.push(
					new Promise((resolve, reject) => {
						if (regimenUrl) {
							request.get(regimenUrl, (err, res_, body) => {
								if (err) {
									return;
								}

								let programData;

								try {
									programData = JSON.parse(body);
									const programItem = programData.message[0] || {};
									finalJson.programs.push({
										name,
										facility: facilityName,
										patient_observations: []
									});
									const patientObservations =
										finalJson.programs[finalJson.programs.length - 1]
											.patient_observations;
									for (const [key, value] of Object.entries(programItem)) {
										// Convert key to human-readable format
										const label = key
											.replace(/_/g, " ")
											.replace(/\b\w/g, (c) => c.toUpperCase());
										// Add label and value to patient observations
										patientObservations.push({ label, value });
									}
								} catch (parseError) {
									reject(parseError);
								}

								resolve();
							});
						} else {
							finalJson.programs.push({
								name,
								facility: facilityName,
								patient_observations: []
							});
							resolve();
						}
					})
				);

				if (program_identifier !== null) {
					promises.push(
						getVLResults(
							`${req.protocol}://${req.get("host")}`,
							user_id,
							authToken
						).then((vlResults) => {
							const existingProgramIndex = finalJson.programs.findIndex(
								(p) => p.name === name && p.facility === facilityName
							);

							if (existingProgramIndex !== -1) {
								const patientObservations =
									finalJson.programs[existingProgramIndex].patient_observations;

								// Extract viral_load from vlResults.result
								const viralLoadValue = vlResults.result;

								// Add viral_load to patient observations
								patientObservations.push({
									label: "Viral Load",
									value: viralLoadValue
								});
							}
						})
					);
				}
			}

			await Promise.all(promises);

			return res.status(200).json(finalJson);
		} catch (error) {
			return res.status(500).json({
				success: false,
				msg: "Error occurred while fetching patient data"
			});
		}
	}
);

router.get("/bmi_details", async (req, res) => {
	try {
		let bmi_details = await NBmi.findAll({
			where: {
				is_active: 1
			}
		});
		return res.status(200).json({
			success: true,
			message: "BMI details successfully found",
			data: bmi_details
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to retrieve BMI details",
			error: error.message
		});
	}
});

// update patient program
router.post(
	"/updateprogram",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let program_id = req.body.program_id;
		let user_id = req.body.user_id;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");
		try {
			const check_user = await NUsers.findOne({
				where: {
					id: base64.decode(user_id)
				}
			});
			if (check_user) {
				const check_user_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [{ is_active: "1" }, { program_type: program_id }]
					}
				});
				if (check_user_program) {
					const update_program = await NUserprograms.update(
						{ is_active: "0" },
						{ where: { program_type: program_id } }
					);

					return res.status(200).json({
						success: true,
						msg: "Program was successfully removed"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "Program is already inActive"
					});
				}
			} else {
				return res.status(200).json({
					success: false,
					msg: "User not found"
				});
			}
		} catch (err) {
			return res.status(500).json({
				success: false,
				msg: "Server error could not remove program"
			});
		}
	}
);

// new patient details
router.get(
	"/patient_clinic_new",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;
			let decodedUserid = base64.decode(user_id);
			let authToken = req.header("Authorization").replace("Bearer ", "");

			let userPrograms = await NUserprograms.findAll({
				where: {
					user_id: decodedUserid,
					is_active: 1
				}
			});

			const finalJson = {
				programs: []
			};

			const promises = [];

			for (const program of userPrograms) {
				const { program_type, program_identifier } = program;

				const programDetails = await NprogramTypes.findOne({
					where: { id: program_type }
				});

				if (!programDetails) {
					continue;
				}

				const { name } = programDetails;

				const clientDetails = await Client.findOne({
					where: { id: program_identifier }
				});

				let patientFacility = null;
				if (clientDetails) {
					const { mfl_code } = clientDetails;

					patientFacility = await masterFacility.findOne({
						where: {
							code: mfl_code
						},
						attributes: ["code", "name"]
					});
				}

				const facilityName = patientFacility ? patientFacility.name : null;

				const regimenUrl = clientDetails
					? `${process.env.ART_URL}patient/${clientDetails.clinic_number}/regimen`
					: null;

				promises.push(
					new Promise((resolve, reject) => {
						if (regimenUrl) {
							request.get(regimenUrl, (err, res_, body) => {
								if (err) {
									return;
								}

								let programData;

								try {
									programData = JSON.parse(body);
									const programItem = programData.message[0] || {};
									finalJson.programs.push({
										name,
										facility: facilityName,
										patient_observations: []
									});
									const patientObservations =
										finalJson.programs[finalJson.programs.length - 1]
											.patient_observations;
									for (const [key, value] of Object.entries(programItem)) {
										// Convert key to human-readable format
										const label = key
											.replace(/_/g, " ")
											.replace(/\b\w/g, (c) => c.toUpperCase());
										// Add label and value to patient observations
										patientObservations.push({ label, value });
									}
								} catch (parseError) {
									reject(parseError);
								}

								resolve();
							});
						} else {
							finalJson.programs.push({
								name,
								facility: facilityName,
								patient_observations: []
							});
							resolve();
						}
					})
				);
			}

			await Promise.all(promises);

			return res.status(200).json(finalJson);
		} catch (error) {
			return res.status(500).json({
				success: false,
				msg: "Error occurred while fetching patient data"
			});
		}
	}
);

router.post(
	"/chat_review",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let rate = req.body.rate;
		let reviews = req.body.reviews;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		const new_review = await NReviews.create({
			user_id: base64.decode(user_id),
			rate: rate,
			reviews: reviews,
			created_at: today,
			updated_at: today
		});

		if (new_review) {
			return res.status(200).json({
				success: true,
				msg: "Thank you for your feedback. "
			});
		} else {
			return res.status(200).json({
				success: false,
				msg: "An error occurred, could not process your review"
			});
		}
	}
);

router.post(
	"/validateprograms",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		//common body requests for all programs
		let program_id = req.body.program_id;
		let user_id = req.body.user_id;
		//	let otp = req.body.otp_number;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let programs = await NprogramTypes.findOne({
			where: {
				is_active: 1,
				id: program_id
			}
		});

		if (!programs) {
			return res.status(200).json({
				success: false,
				msg: "The program is not Active"
			});
		}

		//Check If User Exists
		let check_username = await NUserprograms.findOne({
			where: {
				[Op.and]: [{ id: base64.decode(user_id) }, { program_type: program_id }]
			}
		});
		// existing program
		let existing_other_program = await NUserprograms.findOne({
			where: {
				[Op.and]: [
					{ user_id: base64.decode(user_id) },
					{ is_active: 0 },
					{ program_type: program_id }
				]
			}
		});

		// Hiv program set up
		if (program_id === 1) {
			let ccc_no = req.body.ccc_no;
			let upi_no = req.body.upi_no;
			let firstname = req.body.firstname;

			//Check if CCC is 10 digits
			if (ccc_no.length != 10) {
				return res.status(200).json({
					success: false,
					msg: `Invalid CCC Number: ${ccc_no}, The CCC must be 10 digits`
				});
			}
			//Validate Program In HIV
			let check_program_valid = await Client.findOne({
				where: { clinic_number: ccc_no }
			});

			let check_program_new = await NUserprograms.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{ program_type: "1" } // ART program
					]
				}
			});

			if (!check_program_valid) {
				// if (
				// 	check_program_valid.f_name.toUpperCase() !== firstname.toUpperCase()
				// ) {
				return res.status(200).json({
					success: false,
					msg: `Invalid CCC Number: ${ccc_no}, The CCC Number does not match in Nishauri`
				});
				// }
			}

			let check_valid_user = await Client.findOne({
				where: {
					[Op.and]: [{ f_name: firstname }, { clinic_number: ccc_no }]
				}
			});

			if (!check_valid_user) {
				return res.status(200).json({
					success: false,
					msg: `The First Name does not match with CCC Number: ${ccc_no} in Nishauri`
				});
			}

			if (existing_other_program) {
				//Search if Program Details Exist
				let check_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ program_identifier: check_program_valid.id },
							{ user_id: base64.decode(user_id) },
							{ is_active: 1 },
							{ program_type: "1" } // ART program
						]
					}
				});
				let existing_other_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ user_id: base64.decode(user_id) },
							{ is_active: 0 },
							{ program_type: program_id }
						]
					}
				});
				let check_art_user = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ program_identifier: { [Op.ne]: check_program_valid.id } },
							{ user_id: base64.decode(user_id) },
							{ program_type: program_id }
						]
					}
				});

				if (check_art_user) {
					return res.status(200).json({
						success: false,
						msg: `The ART Program details does not belong to your records`
					});
				} else if (check_program) {
					return res.status(200).json({
						success: false,
						msg: "Program registration record already exists"
					});
				} else if (existing_other_program) {
					if (!check_program_valid) {
						return res.status(200).json({
							success: false,
							msg: `Invalid CCC Number: ${ccc_no}, The CCC Number does not match in Nishauri`
						});
					}
					if (!check_valid_user) {
						return res.status(200).json({
							success: false,
							msg: `The First Name does not match with CCC Number: ${ccc_no} in Nishauri `
						});
					}

					let vOTP = generateOtp(5);

					//Send OTP
					const header_details = {
						rejectUnauthorized: false,
						url: process.env.SMS_API_URL,
						method: "POST",
						json: true,
						headers: {
							Accept: "application/json",
							"api-token": process.env.SMS_API_KEY
						},

						body: {
							destination: check_valid_user.phone_no,
							msg:
								"Dear Nishauri User, Your OTP to set up program is " +
								vOTP +
								". Valid for the next 24 hours.",
							sender_id: check_valid_user.phone_no,
							gateway: process.env.SMS_SHORTCODE
						}
					};

					request.post(header_details, (err, res, body) => {
						if (err) {
							console.log(err);
							//Error Sending OTP
							return res.status(200).json({
								success: false,
								msg: "Error Sending OTP"
							});
						}
					});

					let check_otp = await NprogramOTP.findOne({
						where: {
							[Op.and]: [
								{ user_id: base64.decode(user_id) },
								{ program_id: program_id }
							]
						}
					});
					//Save OTP
					if (check_otp) {
						const save_OTP = await NprogramOTP.update(
							{ program_otp: vOTP },
							{
								where: {
									[Op.and]: [
										{ user_id: base64.decode(user_id) },
										{ program_id: program_id }
									]
								}
							}
						);
					} else {
						//Save OTP
						const save_OTP = await NprogramOTP.create({
							user_id: base64.decode(user_id),
							program_id: program_id,
							program_otp: vOTP,
							created_at: today,
							updated_at: today
						});
					}

					var l = {
						// user_id: base64.encode(check_username.id),
						phoneno: check_program_valid.phone_no,
						otp: existing_other_program.program_otp
					};

					//Send OTP Number
					return res.status(200).json({
						success: true,
						msg: "User OTP sent out successfully",
						data: l
					});
				}
			} else {
				let check_all_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ user_id: base64.decode(user_id) },
							{ is_active: 1 },
							{ program_type: program_id } // for other programs
						]
					}
				});
				if (check_all_program) {
					return res.status(200).json({
						success: true,
						msg: "Program registration record already exists."
					});
				} else {
					let vOTP = generateOtp(5);

					//Send OTP
					const header_details = {
						rejectUnauthorized: false,
						url: process.env.SMS_API_URL,
						method: "POST",
						json: true,
						headers: {
							Accept: "application/json",
							"api-token": process.env.SMS_API_KEY
						},

						body: {
							destination: check_valid_user.phone_no,
							msg:
								"Dear Nishauri User, Your OTP to set up program is " +
								vOTP +
								". Valid for the next 24 hours.",
							sender_id: check_valid_user.phone_no,
							gateway: process.env.SMS_SHORTCODE
						}
					};

					request.post(header_details, (err, res, body) => {
						if (err) {
							console.log(err);
							//Error Sending OTP
							return res.status(200).json({
								success: false,
								msg: "Error Sending OTP"
							});
						}
					});
					//Save OTP
					const save_OTP = await NprogramOTP.create({
						user_id: base64.decode(user_id),
						program_id: program_id,
						program_otp: vOTP,
						created_at: today,
						updated_at: today
					});

					var l = {
						// user_id: base64.encode(check_username.id),
						phoneno: check_program_valid.phone_no,
						otp: vOTP
					};

					//Send OTP Number
					return res.status(200).json({
						success: true,
						msg: "User OTP sent out successfully",
						data: l
					});
				}
			}
		} else {
			// other programs set up

			let check_other_program = await NUserprograms.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{ is_active: 1 },
						{ program_type: program_id } // for other programs
					]
				}
			});

			if (check_other_program) {
				return res.status(200).json({
					success: true,
					msg: "Program registration record already exists."
				});
			} else if (existing_other_program) {
				const update_program = await NUserprograms.update(
					{ is_active: "1" },
					{
						where: {
							[Op.and]: [
								{ user_id: base64.decode(user_id) },
								{ program_type: program_id } // for other programs
							]
						}
					}
				);

				if (update_program) {
					return res.status(200).json({
						success: true,
						msg: "Program activation was Succesfully"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "An error occurred, could not activate program record"
					});
				}
			} else {
				//Save Program Details If Exist

				const new_user_program = await NUserprograms.create({
					user_id: base64.decode(user_id),
					program_type: program_id,
					is_active: "1",
					activation_date: today,
					created_at: today,
					updated_at: today
				});

				if (new_user_program) {
					return res.status(200).json({
						success: true,
						msg: "Program registration was succesfully"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "An error occurred, could not create program record"
					});
				}
			}
		}
	}
);

// resend otp to program setup
router.post(
	"/resendotp",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let program_id = req.body.program_id;
		let ccc_no = req.body.ccc_no;
		let today = moment(new Date().toDateString()).format("YYYY-MM-DD");

		let check_username = await NUsers.findOne({
			where: {
				[Op.and]: [{ is_active: "1" }, { id: base64.decode(user_id) }]
			}
		});

		let check_program_valid = await Client.findOne({
			where: { clinic_number: ccc_no }
		});

		if (check_username) {
			let vOTP = generateOtp(5);

			//Send SMS
			const header_details = {
				rejectUnauthorized: false,
				url: process.env.SMS_API_URL,
				method: "POST",
				json: true,
				headers: {
					Accept: "application/json",
					"api-token": process.env.SMS_API_KEY
				},

				body: {
					destination: check_program_valid.phone_no,
					msg:
						"Dear Nishauri User, Your OTP to set up program is " +
						vOTP +
						". Valid for the next 24 hours.",
					sender_id: check_program_valid.phone_no,
					gateway: process.env.SMS_SHORTCODE
				}
			};

			request.post(header_details, (err, res, body) => {
				if (err) {
					console.log(err);
					//Error Sending OTP
					return res.status(200).json({
						success: false,
						msg: "Error Sending OTP"
					});
				}
			});

			let check_otp = await NprogramOTP.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{ program_id: program_id }
					]
				}
			});
			//Save OTP
			if (check_otp) {
				const save_OTP = await NprogramOTP.update(
					{ program_otp: vOTP },
					{
						where: {
							[Op.and]: [
								{ user_id: base64.decode(user_id) },
								{ program_id: program_id }
							]
						}
					}
				);
			} else {
				//Save OTP
				const save_OTP = await NprogramOTP.create({
					user_id: base64.decode(user_id),
					program_id: program_id,
					program_otp: vOTP,
					created_at: today,
					updated_at: today
				});
			}

			var l = {
				phoneno: check_program_valid.phone_no,
				otp: vOTP
			};

			//Sent OTP Number
			return res.status(200).json({
				success: true,
				msg: "User OTP sent out successfully",
				data: l
			});
		} else {
			//Show Error Message
			return res.status(200).json({
				success: false,
				msg: "User doesnt exists or is inactive"
			});
		}
	}
);
router.get(
	"/get_faqs",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let questions = await NFAQ.findAll({
				where: {
					status: "1"
				}
			});
			if (questions) {
				return res.status(200).json({
					success: true,
					message: "FAQs were successfully retrieved",
					questions: questions
				});
			} else {
				return res.status(200).json({
					success: false,
					message: "Could not get the FAQs"
				});
			}
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Failed to retrieve FAQs",
				error: error.message
			});
		}
	}
);

const termsAndConditions = {
	termsConditions: {
		title: "Terms and Conditions for System Users",
		introduction:
			'These Terms and Conditions ("Agreement") govern your use of this Health Information System ("System") as a healthcare provider and/or implementer. By accessing or using the System, you agree to comply with these Terms and Conditions.',
		sections: [
			{
				header: "Data Handling and Access",
				content: [
					"You shall handle health data in compliance with the agreed-upon data handling policies and procedures as set out by Ministry of Health Kenya and Kenya Data Protection Act 2019.",
					"Access and use the data stored within the System solely for authorized purposes related to patient care, public health initiatives, or as permitted by applicable Kenyan laws and regulations."
				]
			},
			{
				header: "Security and Confidentiality",
				content: [
					"You shall maintain the confidentiality and security of health data by adhering to the established security protocols, access controls, and encryption measures.",
					"Prevent unauthorized access, loss, or disclosure of data and promptly report any potential breaches or security incidents to the appropriate legal channels, the System implementers."
				]
			},
			{
				header: "Data Accuracy and Completeness",
				content: [
					"You are responsible for ensuring the accuracy and completeness of the health data you input or modify within the System.",
					"Regularly review and update the data to maintain its integrity, relevance, and usefulness for healthcare provision and public good purposes."
				]
			},
			{
				header: "Purpose-Limited Use",
				content: [
					"Utilize the health data stored within the System solely for the purposes specified in these Terms and Conditions, such as patient care, public health analysis, or healthcare service improvement.",
					"Refrain from using the data for personal or unauthorized purposes that may compromise privacy or violate data protection regulations."
				]
			},
			{
				header: "Training and Awareness",
				content: [
					"Stay informed and updated on the proper use and handling of health data.",
					"Participate in training sessions or educational programs provided by the System implementors to enhance your understanding of data privacy, security practices, and compliance requirements."
				]
			},
			{
				header: "Data Subject Rights",
				content: [
					"Respect the rights of individuals regarding their health data.",
					"Promptly address any requests from patients regarding access, rectification, or erasure of their personal information as permitted by applicable data protection laws."
				]
			},
			{
				header: "Reporting and Compliance",
				content: [
					"Report any concerns, breaches, or incidents related to health data handling promptly to the right legal channels and the System implementers or designated authority within your organization.",
					"Comply with internal policies and procedures as well as applicable laws and regulations governing health data retention and protection."
				]
			},
			{
				header: "Third-Party Usage",
				content: [
					"If you engage any third-party service providers who have access to the health data, ensure they comply with these Terms and Conditions and adhere to appropriate data protection and security measures.",
					"Enter into appropriate agreements with third parties to safeguard the confidentiality and security of the data they handle.",
					"Data from this system will be transmitted to the National Datawarehouse for purposes of promoting continuity of healthcare services and for health implementation monitoring, reporting, and research purposes. The data in the NDW will be handled in accordance with Kenyan data protection laws and other relevant regulations."
				]
			},
			{
				header: "Auditing and Monitoring",
				content: [
					"Cooperate with audits, assessments, or monitoring activities conducted to ensure compliance with these Terms and Conditions.",
					"Provide necessary information and access to systems as requested for compliance verification and data protection purposes."
				]
			},
			{
				header: "Modification or Termination of Agreement",
				content: [
					"The System Implementers reserves the right to modify or terminate this Agreement at any time.",
					"Notice of any changes will be provided in advance, and your continued use of the System following such notice constitutes acceptance of the modified Agreement."
				]
			},
			{
				header: "Entire Agreement",
				content: [
					"These Terms and Conditions constitute the entire agreement between you and the System Implementer regarding your use of the System. If you do not agree with any part of these Terms and Conditions, please refrain from accessing or using the System.",
					"By accessing or using the System, you acknowledge that you have read, understood, and agreed to these Terms and Conditions."
				]
			}
		]
	},
	privacyPolicy: {
		title: "Privacy Policy",
		introduction:
			'This Privacy Policy ("Policy") describes how we, as KenyaHMIS project providing the Health Information System ("System"), collects, uses, discloses, and protects personal information in connection with the System. We are committed to safeguarding your privacy and ensuring the confidentiality and security of your personal data.',
		sections: [
			{
				header: "Collection of Personal Information",
				content: [
					"We may collect personal information from various stakeholders, including healthcare providers, health facilities, patients, clients, and system users, as necessary for the functioning of the System.",
					"Personal information may include but is not limited to names, contact details, health records, and other information relevant to the provision of healthcare services and system usage."
				]
			},
			{
				header: "Use of Personal Information",
				content: [
					"Personal information collected will be used for the purposes of healthcare provision, health data management (Includes access, processing, sharing, use etc.), retention, analysis, and improvement of healthcare services.",
					"We may also use personal information to communicate with system users, provide support, and facilitate the proper functioning of the System."
				]
			},
			{
				header: "Disclosure of Personal Information",
				content: [
					"We may share personal information with authorized personnel, including healthcare providers, administrators, and other stakeholders involved in the provision of healthcare services.",
					"Personal information may also be disclosed to comply with legal obligations, enforce our rights, or protect the rights, safety, or security of individuals or the public."
				]
			},
			{
				header: "Data Security",
				content: [
					"We implement appropriate technical and organizational measures to protect personal information from unauthorized access, loss, misuse, or disclosure.",
					"We maintain security protocols, access controls, and encryption measures to ensure the confidentiality, integrity, and availability of personal data within the System."
				]
			},
			{
				header: "Data Retention",
				content: [
					"Personal information will be retained for as long as necessary to fulfill the purposes for which it was collected and in accordance with applicable Kenyan laws and regulations including but not limited to The Kenya Data Protection Act 2019.",
					"We adhere to data retention policies and procedures to ensure that personal information is retained securely and in compliance with privacy requirements."
				]
			},
			{
				header: "Data Subject Rights",
				content: [
					"Individuals have the right to access, rectify, or request the deletion of their personal information as permitted by applicable data protection laws.",
					"Requests related to personal information should be submitted to the healthcare provider, designated contact person or administrator as applicable by law."
				]
			},
			{
				header: "Third-Party Services and Links",
				content: [
					"The System may integrate with or provide links to third-party services or systems within the healthcare ecosystem.",
					"This Privacy Policy applies solely to the System, and we are not responsible for the privacy practices or content of third-party services or systems."
				]
			},
			{
				header: "Updates to the Privacy Policy",
				content: [
					"We reserve the right to update or modify this Privacy Policy at any time.",
					"Changes to the Policy will be communicated through appropriate channels or by posting an updated version on the System or our website."
				]
			},
			{
				header: "Contact Information",
				content: [
					"If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of personal information, please contact the KenyaHMIS Project through https://kenyahmis.org/contact/",
					"By using the System, you consent to the collection, use, and disclosure of personal information as described in this Privacy Policy. If you do not agree with any part of this Policy, please refrain from using the System."
				]
			},
			{
				header: "Effective Date",
				content: [
					"This Privacy Policy is effective as of version released in May 2023 and shall remain in effect until modified or replaced.",
					"By accessing or using the System, you acknowledge that you have read, understood, and agreed to this Privacy Policy."
				]
			}
		]
	},
	healthDataTerms: {
		title: "Terms and Conditions for Collecting Health Data",
		introduction:
			"To be used for consenting in Data collection either for data provided directly or indirectly. Data Subjects should be aware of their rights.",
		sections: [
			{
				header: "Consent",
				content: [
					"By using this digital health solution and providing your health data, you explicitly consent to its collection, storage, and processing for the specified purposes outlined in these terms and conditions. You have the right to withdraw your consent at any time."
				]
			},
			{
				header: "Lawful Basis",
				content: [
					"The collection and processing of your health data will be carried out based on one or more lawful bases as defined by applicable Kenyan data protection laws, including but not limited to the Kenya Data Protection Act 2019."
				]
			},
			{
				header: "Purpose and Scope",
				content: [
					"Your health data will be collected for the purpose of health service provision (e.g., medical treatment, medical reviews, and assessment etc.). The data collected will be limited to what is necessary and directly relevant to the specified health provision purpose.",
					"This health data will be stored, persisted, and processed for the purpose of promoting public health and advancing healthcare initiatives for the public good. This may include analysis, statistical purposes, policy development, research and improving healthcare services.",
					"Additional data will be collected to manage user accounts and profile information that is used to create user accounts for digital health solutions. The personal data facilitates user access to different functionalities of the solution that are available to account users."
				]
			},
			{
				header: "Data Security",
				content: [
					"We implement appropriate technical and organizational measures to ensure the security and confidentiality of your health data. These measures include safeguards against unauthorized access, loss, or disclosure, and regular monitoring and updating of security protocols."
				]
			},
			{
				header: "Data Retention",
				content: [
					"Your health data will be retained for a period necessary to fulfill the specified purpose and comply with legal obligations. After this period, your data will be securely and permanently anonymized or archived in Ministry of Health Kenya Repositories, unless there is a legal basis or legitimate reason for its continued retention."
				]
			},
			{
				header: "Data Sharing",
				content: [
					"Your health data may be shared with authorized third parties, such as healthcare providers, research institutions, MoH Kenya affiliates or public health authorities, to facilitate the specified purpose. Any sharing of data will be conducted in compliance with applicable Kenyan laws and with appropriate data protection agreements in place."
				]
			},
			{
				header: "Data Subject Rights",
				content: [
					"You have the right to access, rectify, and erase your health data, as well as the right to restrict processing and object to automated decision-making. To exercise these rights or for any inquiries or concerns regarding your health data, please contact the KenyaHMIS through https://kenyahmis.org/contact/ or the Ministry of Health (MoH) Kenya through https://www.health.go.ke/contact-us/. Please note, however, that we might need to retain certain information when there is a legal obligation or lawful basis to do so."
				]
			},
			{
				header: "Data Protection Officer",
				content: [
					"We have appointed a Data Protection Officer (DPO) who can be contacted regarding any matters related to the collection, storage, and processing of your health data. The DPO contacts will be provided by the healthcare provider whenever needed."
				]
			},
			{
				header: "Data Breach Notification",
				content: [
					"In the event of a data breach that may pose risks to your rights and freedoms, we will promptly notify you and/ or the relevant supervisory authority in compliance with applicable data protection laws."
				]
			},
			{
				header: "Changes to Terms and Conditions",
				content: [
					"We reserve the right to modify or update these terms and conditions. Any changes will be communicated to you through appropriate means and will require your renewed consent if necessary."
				]
			},
			{
				header: "Final Acknowledgment",
				content: [
					"By providing your health data, you acknowledge that you have read, understood, and agreed to these terms and conditions. If you do not agree with any of the provisions outlined herein, please refrain from providing your health data."
				]
			}
		]
	}
};

router.get("/terms_conditions", (req, res) => {
	res.json(termsAndConditions);
});
router.post(
	"/chat_consent",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let user_consent = await NUsers.findOne({
			where: {
				id: base64.decode(user_id)
			}
		});

		if (user_consent.chatbot_consent === "1") {
			const consent = await NUsers.update(
				{ chatbot_consent_date: today, chatbot_consent: "0" },
				{ where: { id: base64.decode(user_id) } }
			);
			if (consent) {
				return res.status(200).json({
					success: true,
					msg: "Consent was successfully revoked"
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "An error occurred, could not consent"
				});
			}
		} else {
			const new_consent = await NUsers.update(
				{ chatbot_consent_date: today, chatbot_consent: "1" },
				{ where: { id: base64.decode(user_id) } }
			);
			if (new_consent) {
				return res.status(200).json({
					success: true,
					msg: "Consent was successfull"
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "An error occurred, could not consent"
				});
			}
		}
	}
);
router.get(
	"/get_chat_consent",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const user_id = req.query.user_id;

			const user_consent = await NUsers.findOne({
				attributes: ["chatbot_consent", "chatbot_consent_date"],
				where: {
					id: base64.decode(user_id)
				}
			});

			if (user_consent) {
				return res.status(200).json({
					success: true,
					message: "User consent retrieved successfully",
					data: {
						user_consent,
						user_id: user_id
					}
				});
			} else {
				return res.status(404).json({
					success: false,
					message: "User not found"
				});
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

router.post(
	"/post_bmi",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let height = req.body.height;
		let weight = req.body.weight;
		let results = req.body.results;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let user = await NUsers.findOne({
			where: {
				id: base64.decode(user_id)
			}
		});

		if (user) {
			let existing_bmi = await NBmiLog.findOne({
				where: {
					[Op.and]: [
						{ user_id: base64.decode(user_id) },
						{
							created_at: {
								[Op.gte]: new Date(today),
								[Op.lt]: new Date(
									new Date(today).getTime() + 24 * 60 * 60 * 1000
								)
							}
						}
					]
				}
			});
			if (existing_bmi) {
				const update_bmi = await NBmiLog.update(
					{
						height: height,
						weight: weight,
						results: results,
						updated_at: today
					},
					{
						where: {
							[Op.and]: [
								{ user_id: base64.decode(user_id) },
								{
									created_at: {
										[Op.gte]: new Date(today),
										[Op.lt]: new Date(
											new Date(today).getTime() + 24 * 60 * 60 * 1000
										)
									}
								}
							]
						}
					}
				);
				var log_activity_ = NLogs.create({
					user_id: base64.decode(user_id),
					access: "BMICALCULATOR"
				});

				if (update_bmi) {
					return res.status(200).json({
						success: true,
						msg: "BMI results was successfully logged up"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "Error occured while logging BMI results"
					});
				}
			} else {
				const new_bmi = await NBmiLog.create({
					height: height,
					weight: weight,
					results: results,
					user_id: base64.decode(user_id),
					created_at: today,
					updated_at: today
				});
				var log_activity_ = NLogs.create({
					user_id: base64.decode(user_id),
					access: "BMICALCULATOR"
				});

				if (new_bmi) {
					return res.status(200).json({
						success: true,
						msg: "BMI results was successfully logged"
					});
				} else {
					return res.status(200).json({
						success: false,
						msg: "Error occured while logging BMI results"
					});
				}
			}
		} else {
			return res.status(404).json({
				success: false,
				msg: "User not found"
			});
		}
	}
);
router.post(
	"/blood_pressure",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let systolic = req.body.systolic;
		let diastolic = req.body.diastolic;
		let pulse_rate = req.body.pulse_rate;
		let notes = req.body.notes;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let user = await NUsers.findOne({
			where: {
				id: base64.decode(user_id)
			}
		});

		if (user) {
			const new_blood_pressure = await NBloodPressure.create({
				systolic: systolic,
				diastolic: diastolic,
				pulse_rate: pulse_rate,
				user_id: base64.decode(user_id),
				notes: notes,
				created_at: today,
				updated_at: today
			});
			var log_activity_ = NLogs.create({
				user_id: base64.decode(user_id),
				access: "BLOODPRESSURE"
			});
			if (new_blood_pressure) {
				return res.status(200).json({
					success: true,
					msg: "You successfully logged your blood pressure"
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "Could not logged your blood pressure"
				});
			}
		} else {
			return res.status(404).json({
				success: false,
				msg: "User not found"
			});
		}
	}
);

router.get(
	"/get_blood_pressure",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;

			let blood_pressure = await NBloodPressure.findAll({
				attributes: [
					"systolic",
					"diastolic",
					"pulse_rate",
					"notes",
					"created_at"
				],
				where: {
					user_id: base64.decode(user_id)
				}
			});

			//console.log(blood_pressure);

			if (blood_pressure && blood_pressure.length > 0) {
				let transformedData = blood_pressure.map((bp) => {
					return {
						systolic: bp.systolic,
						diastolic: bp.diastolic,
						pulse_rate: bp.pulse_rate,
						notes: bp.notes,
						date_time: moment(bp.created_at).format("YYYY-MM-DD H:h:s")
					};
				});
				return res.status(200).json({
					success: true,
					message: "User blood pressure logs retrieved successfully",
					data: {
						blood_pressure: blood_pressure,
						user_id: user_id
					}
				});
			} else {
				return res.status(404).json({
					success: false,
					message: "No blood pressure data found for this User"
				});
			}
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

router.get(
	"/get_bmi",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;

			let bmi_log = await NBmiLog.findAll({
				attributes: ["weight", "height", "results", "created_at"],
				where: {
					user_id: base64.decode(user_id)
				}
			});

			if (bmi_log && bmi_log.length > 0) {
				let final_bmi = bmi_log.map((bp) => {
					return {
						weight: bp.weight,
						height: bp.height,
						results: bp.results,
						date: moment(bp.created_at).format("YYYY-MM-DD")
					};
				});

				return res.status(200).json({
					success: true,
					message: "User BMI logs retrieved successfully",
					data: {
						bmi_log: bmi_log,
						user_id: user_id
					}
				});
			} else {
				return res.status(404).json({
					success: false,
					message: "No BMI data found for this User"
				});
			}
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);
router.get(
	"/patient_data",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.query.user_id;

		let check_program = await NUserprograms.findOne({
			where: {
				[Op.and]: [{ program_type: "1" }, { user_id: base64.decode(user_id) }]
			}
		});
		if (check_program) {
			let patient = await Client.findOne({
				attributes: ["dob", "gender"],
				where: {
					id: check_program.program_identifier
				}
			});
			if (patient) {
				patient = patient.toJSON();
				patient.gender =
					patient.gender === 1
						? "Female"
						: patient.gender === 2
						? "Male"
						: "Unknown";
				return res.status(200).json({
					success: true,
					message: "Patient data retrieved successfully",
					data: {
						patient_data: patient
					}
				});
			} else {
				return res.status(200).json({
					success: false,
					message: "Could not find the data"
				});
			}
		} else {
			return res.status(200).json({
				success: false,
				message: "Could not find the patient data"
			});
		}
	}
);
router.post(
	"/blood_sugar",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let level = req.body.level;
		let condition = req.body.condition;
		let notes = req.body.notes;
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let user = await NUsers.findOne({
			where: {
				id: base64.decode(user_id)
			}
		});

		if (user) {
			const new_blood_sugar = await NBloodSugar.create({
				level: level,
				condition: condition,
				user_id: base64.decode(user_id),
				notes: notes,
				created_at: today,
				updated_at: today
			});
			var log_activity_ = NLogs.create({
				user_id: base64.decode(user_id),
				access: "BLOODSUGAR"
			});
			if (new_blood_sugar) {
				return res.status(200).json({
					success: true,
					msg: "You successfully logged your blood sugar"
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "Could not logged your blood sugar"
				});
			}
		} else {
			return res.status(404).json({
				success: false,
				msg: "User not found"
			});
		}
	}
);

router.get(
	"/get_blood_sugar",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;

			let blood_sugar = await NBloodSugar.findAll({
				attributes: ["level", "condition", "notes", "created_at"],
				where: {
					user_id: base64.decode(user_id)
				}
			});

			if (blood_sugar && blood_sugar.length > 0) {
				let final_blood_sugar = blood_sugar.map((bp) => {
					return {
						level: bp.level,
						condition: bp.condition,
						notes: bp.notes,
						date: moment(bp.created_at).format("YYYY-MM-DD HH:mm:ss")
					};
				});

				return res.status(200).json({
					success: true,
					message: "User Blood sugar logs retrieved successfully",
					data: {
						blood_sugar: blood_sugar,
						user_id: user_id
					}
				});
			} else {
				return res.status(404).json({
					success: false,
					message: "No Blood sugar data found for this User"
				});
			}
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

const messaging = admin.messaging();

const sendReminder = (registrationToken, appointmentDate, daysBefore) => {
	const appointment = new Date(appointmentDate);
	const options = { year: "numeric", month: "long", day: "numeric" };
	const formattedDate = appointment.toLocaleDateString(undefined, options);

	let messageBody = "";

	if (daysBefore === 7) {
		messageBody = `Your appointment is on ${formattedDate}.`;
	} else if (daysBefore === 1) {
		messageBody = "Your appointment is tomorrow.";
	}

	const message = {
		notification: {
			title: "Appointment Reminder",
			body: messageBody
		},
		token: registrationToken
	};

	messaging
		.send(message)
		.then((response) => {
			console.log("Successfully sent message:", response);
		})
		.catch((error) => {
			console.error("Error sending message:", error);
		});
};

const scheduleReminders = (registrationToken, appointmentDate) => {
	const appointment = new Date(appointmentDate);

	const reminderHour7DaysBefore = 11;
	const reminderMinute7DaysBefore = 0;
	const reminderHour1DayBefore = 11;
	const reminderMinute1DayBefore = 0;

	const sevenDaysBefore = new Date(appointment);
	sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
	sevenDaysBefore.setHours(
		reminderHour7DaysBefore,
		reminderMinute7DaysBefore,
		0,
		0
	);

	const oneDayBefore = new Date(appointment);
	oneDayBefore.setDate(oneDayBefore.getDate() - 1);
	oneDayBefore.setHours(reminderHour1DayBefore, reminderMinute1DayBefore, 0, 0);

	const cronExpressionSevenDays = `${sevenDaysBefore.getMinutes()} ${sevenDaysBefore.getHours()} ${sevenDaysBefore.getDate()} ${
		sevenDaysBefore.getMonth() + 1
	} *`;
	const cronExpressionOneDay = `${oneDayBefore.getMinutes()} ${oneDayBefore.getHours()} ${oneDayBefore.getDate()} ${
		oneDayBefore.getMonth() + 1
	} *`;

	cron.schedule(cronExpressionSevenDays, () => {
		sendReminder(registrationToken, appointmentDate, 7);
	});

	cron.schedule(cronExpressionOneDay, () => {
		sendReminder(registrationToken, appointmentDate, 1);
	});
};

const run = async () => {
	const conn = await mysql_promise.createPool({
		connectionLimit: 10,
		host: process.env.DB_SERVER,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		debug: false,
		multipleStatements: true
	});

	try {
		const [users] = await conn.query("SELECT id FROM tbl_nishauri_users");
		for (const user of users) {
			const userId = user.id;

			const [results] = await conn.query("CALL sp_dawa_drop_appt(?)", [userId]);
			const appointments = results[0];

			if (appointments.length === 0) {
				// console.log(`User ${userId} does not have upcoming appointments.`);
				continue;
			}

			for (const appointment of appointments) {
				const { appointment_date, fcm_token: registrationToken } = appointment;
				if (registrationToken) {
					scheduleReminders(registrationToken, appointment_date);
				} else {
					// console.log('No FCM token for user:', userId);
				}
			}
		}
	} catch (error) {
		console.error("Error:", error.message);
	} finally {
		await conn.end();
	}
};

run();

// dawa drop notification
const sendStatusChangeNotification = (registrationToken, status) => {
	const message = {
		notification: {
			title: "Dawa Drop Status Update",
			body: `Your order has been ${status}.`
		},
		token: registrationToken
	};

	messaging
		.send(message)
		.then((response) => {
			console.log("Successfully sent status change notification:", response);
		})
		.catch((error) => {
			console.error("Error sending status change notification:", error);
		});
};

const checkAndSendStatusNotification = (program, registrationToken) => {
	const { status, approved_date, dispatched_date } = program;
	const approveDateOnly = new Date(approved_date).toISOString().split("T")[0];
	const dispatchedDateOnly = new Date(dispatched_date)
		.toISOString()
		.split("T")[0];
	const currentDate = new Date().toISOString().split("T")[0];

	if (status === "Approved" && approveDateOnly === currentDate) {
		sendStatusChangeNotification(registrationToken, "Approved");
	} else if (status === "Dispatched" && dispatchedDateOnly === currentDate) {
		sendStatusChangeNotification(registrationToken, "Dispatched");
	} else {
		// console.log('No status change detected or missing date.');
	}
};

const push = async () => {
	const conn = await mysql_promise.createPool({
		connectionLimit: 10,
		host: process.env.DB_SERVER,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		debug: false,
		multipleStatements: true
	});

	try {
		const [users] = await conn.query(
			"SELECT id, fcm_token FROM tbl_nishauri_users"
		);
		for (const user of users) {
			const userId = user.id;
			const registrationToken = user.fcm_token;

			const [results] = await conn.query("CALL sp_nishauri_drug_delivery(?)", [
				userId
			]);

			const programs = results[0] || []; // Ensure the correct result set is used

			if (programs.length > 0) {
				for (const program of programs) {
					checkAndSendStatusNotification(program, registrationToken);
				}
			} else {
				// console.log(`User ${userId} does not have any drug delivery programs.`);
			}
		}
	} catch (error) {
		console.error("Error:", error.message);
	} finally {
		await conn.end();
	}
};

push();

// appointment reschedule request status update notification
const sendStatusRescheduleNotification = (registrationToken, r_status) => {
	if (!registrationToken) {
		//console.error('Error: Missing registration token.');
		return;
	}

	const message = {
		notification: {
			title: "Appointment Reschedule Status Update",
			body: `Your appointment reschedule request has been ${r_status}.`
		},
		token: registrationToken
	};

	messaging
		.send(message)
		.then((response) => {
			console.log("Successfully sent status change notification:", response);
		})
		.catch((error) => {
			console.error("Error sending status change notification:", error);
		});
};

const checkAndSendRescheduleStatusNotification = (
	reschedule,
	registrationToken
) => {
	const { r_status, process_date } = reschedule;
	const processDateOnly = new Date(process_date).toISOString().split("T")[0];
	const currentDate = new Date().toISOString().split("T")[0];

	if (r_status === "1" && processDateOnly === currentDate) {
		sendStatusRescheduleNotification(registrationToken, "Approved");
	} else if (r_status === "2" && processDateOnly === currentDate) {
		sendStatusRescheduleNotification(registrationToken, "Rejected");
	} else {
		// console.log('No status change detected or missing date.');
	}
};

const pass = async () => {
	const conn = await mysql_promise.createPool({
		connectionLimit: 10,
		host: process.env.DB_SERVER,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		debug: false,
		multipleStatements: true
	});

	try {
		const [users] = await conn.query(
			"SELECT id, fcm_token FROM tbl_nishauri_users"
		);
		for (const user of users) {
			const userId = user.id;
			const registrationToken = user.fcm_token;

			const [results] = await conn.query("CALL sp_nishauri_current_appt(?)", [
				userId
			]);

			const programs = results[0] || [];

			if (programs.length > 0) {
				for (const reschedule of programs) {
					checkAndSendRescheduleStatusNotification(
						reschedule,
						registrationToken
					);
				}
			} else {
				//console.log(`No programs found for user ID ${userId}`);
			}
		}
	} catch (error) {
		console.error("Error:", error.message);
	} finally {
		await conn.end();
	}
};

pass();

//end appointment rechedule request notification

router.post(
	"/menstrual_cycle",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let user_id = req.body.user_id;
		let period_start = req.body.period_start;
		let period_end = req.body.period_end;
		let fertile_start = req.body.fertile_start;
		let fertile_end = req.body.fertile_end;
		let ovulation = req.body.ovulation;
		let predicted_period_start = req.body.predicted_period_start;
		let predicted_period_end = req.body.predicted_period_end;
		let cycle_length = req.body.cycle_length;
		let period_length = req.body.period_length;
		let status = "Active";
		let today = moment(new Date().toDateString())
			.tz("Africa/Nairobi")
			.format("YYYY-MM-DD H:M:S");

		let user = await NUsers.findOne({
			where: {
				id: base64.decode(user_id)
			}
		});

		if (user) {
			const new_menstrual_cycle = await NMenstrual.create({
				period_start: period_start,
				period_end: period_end,
				user_id: base64.decode(user_id),
				fertile_start: fertile_start,
				fertile_end: fertile_end,
				ovulation: ovulation,
				predicted_period_start: predicted_period_start,
				predicted_period_end: predicted_period_end,
				cycle_length: cycle_length,
				period_length: period_length,
				status: status,
				created_at: today,
				updated_at: today
			});
			var log_activity_ = NLogs.create({
				user_id: base64.decode(user_id),
				access: "MENSTRUALCYCLE"
			});
			if (new_menstrual_cycle) {
				return res.status(200).json({
					success: true,
					msg: "You successfully logged your cycle"
				});
			} else {
				return res.status(200).json({
					success: false,
					msg: "Could not logged your cycle please try again"
				});
			}
		} else {
			return res.status(404).json({
				success: false,
				msg: "User not found"
			});
		}
	}
);

router.get(
	"/get_menstrual_cycle",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const user_id = req.query.user_id;

			const menstrual_cycle = await NMenstrual.findAll({
				where: {
					user_id: base64.decode(user_id),
					status: "Active"
				}
			});

			if (menstrual_cycle) {
				return res.status(200).json({
					success: true,
					message: "Menstrual cycle retrieved successfully",
					data: {
						menstrual_cycle,
						user_id: user_id
					}
				});
			} else {
				return res.status(200).json({
					success: false,
					message: "User not found"
				});
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				success: false,
				message: "Internal Server Error"
			});
		}
	}
);

router.put(
	"/update_menstrual_cycle/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let menstrualCycleId = req.params.id;
			let {
				user_id,
				period_start,
				period_end,
				fertile_start,
				fertile_end,
				ovulation,
				predicted_period_start,
				predicted_period_end,
				cycle_length,
				period_length
			} = req.body;
			let status = "Active";
			let today = moment(new Date().toDateString())
				.tz("Africa/Nairobi")
				.format("YYYY-MM-DD H:M:S");

			let user = await NUsers.findOne({
				where: {
					id: base64.decode(user_id)
				}
			});

			if (user) {
				// Find the menstrual cycle record by ID
				let menstrualCycle = await NMenstrual.findOne({
					where: {
						id: menstrualCycleId,
						user_id: base64.decode(user_id)
					}
				});

				if (menstrualCycle) {
					// Update the menstrual cycle record
					await menstrualCycle.update({
						period_start: period_start,
						period_end: period_end,
						fertile_start: fertile_start,
						fertile_end: fertile_end,
						ovulation: ovulation,
						predicted_period_start: predicted_period_start,
						predicted_period_end: predicted_period_end,
						cycle_length: cycle_length,
						period_length: period_length,
						status: status,
						updated_at: today
					});

					// Log the activity
					await NLogs.create({
						user_id: base64.decode(user_id),
						access: "MENSTRUALCYCLE"
					});

					return res.status(200).json({
						success: true,
						msg: "You successfully updated your cycle"
					});
				} else {
					return res.status(404).json({
						success: false,
						msg: "Menstrual cycle record not found"
					});
				}
			} else {
				return res.status(404).json({
					success: false,
					msg: "User not found"
				});
			}
		} catch (error) {
			console.error(error);
			return res.status(500).json({
				success: false,
				msg: "An error occurred",
				error: error.message
			});
		}
	}
);

router.delete(
	"/delete_menstrual_cycle/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let id = req.params.id; // Get the menstrual cycle ID from URL parameters
			let user_id = req.body.user_id;

			let decoded_user_id = base64.decode(user_id);

			let today = moment(new Date())
				.tz("Africa/Nairobi")
				.format("YYYY-MM-DD HH:mm:ss");

			// Verify user exists
			let user = await NUsers.findOne({ where: { id: decoded_user_id } });

			if (!user) {
				return res.status(404).json({
					success: false,
					msg: "User not found"
				});
			}

			let menstrual_cycle = await NMenstrual.findOne({
				where: {
					[Op.and]: [{ id: id }, { user_id: decoded_user_id }]
				}
			});

			if (!menstrual_cycle) {
				return res.status(404).json({
					success: false,
					msg: "Menstrual cycle record not found"
				});
			}

			// Update the status to 'Deleted'
			await menstrual_cycle.update({
				status: "Deleted",
				updated_at: today,
				deleted_at: today
			});

			// Log the deletion activity
			await NLogs.create({
				user_id,
				access: "MENSTRUALCYCLE"
			});

			return res.status(200).json({
				success: true,
				msg: "Menstrual cycle deleted successfully"
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				msg: "An error occurred while deleting the cycle",
				error: error.message
			});
		}
	}
);

router.delete(
	"/delete_menstrual_cycles",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.body.user_id;

			let today = moment(new Date())
				.tz("Africa/Nairobi")
				.format("YYYY-MM-DD HH:mm:ss");

			// Verify user exists
			let user = await NUsers.findOne({
				where: { id: base64.decode(user_id) }
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					msg: "User not found"
				});
			}

			// Find all menstrual cycles for the user
			let menstrual_cycles = await NMenstrual.findAll({
				where: {
					user_id: base64.decode(user_id)
				}
			});

			if (menstrual_cycles.length === 0) {
				return res.status(404).json({
					success: false,
					msg: "No menstrual cycle records found"
				});
			}

			// Update the status of all menstrual cycles to 'Deleted'
			await NMenstrual.update(
				{
					status: "Deleted",
					updated_at: today,
					deleted_at: today
				},
				{
					where: { user_id: base64.decode(user_id) }
				}
			);

			// Log the deletion activity
			await NLogs.create({
				user_id,
				access: "MENSTRUALCYCLE"
			});

			return res.status(200).json({
				success: true,
				msg: "All menstrual cycles deleted successfully"
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				msg: "An error occurred while deleting the cycles",
				error: error.message
			});
		}
	}
);

const sendAppUpdateNotification = (registrationToken) => {
	if (!registrationToken) {
		return;
	}

	const message = {
		notification: {
			title: "Nishauri Update Available!",
			body: "New features and improvements are here! Update your app now for a better experience."
		},
		token: registrationToken
	};

	messaging
		.send(message)
		.then((response) => {
			//console.log("Successfully sent app update notification:", response);
		})
		.catch((error) => {
			//console.error("Error sending app update notification:", error);
		});
};

const notifyUsersAboutAppUpdate = async () => {
	try {
		let users = await NUsers.findAll({
			attributes: ["id", "fcm_token"]
		});

		for (const user of users) {
			const registrationToken = user.fcm_token;
			sendAppUpdateNotification(registrationToken);
		}
	} catch (error) {
		//console.error("Error:", error.message);
	}
};

// Schedule the notification
const specificDateAndTime = "30 9 14 9 *"; // September 14, 9:30 AM

cron.schedule(specificDateAndTime, () => {
	notifyUsersAboutAppUpdate();
});

router.get("/get_roles", async (req, res) => {
	try {
		let roles = await Nroles.findAll({
			where: {
				status: "Active"
			}
		});
		return res.status(200).json({
			success: true,
			message: "Roles were successfully retrieved",
			roles: roles
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to retrieve roles",
			error: error.message
		});
	}
});

router.get(
	"/get_bmi_filter",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;
			let decoded_user_id = base64.decode(user_id);

			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay());

			// weekly BMI logs
			const weeklyLogs = await NBmiLog.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: startOfWeek,
						[Op.lte]: today
					}
				},
				attributes: [
					[fn("DAYNAME", col("created_at")), "dayName"],
					[fn("DATE", col("created_at")), "date"],
					"weight",
					"height",
					"results"
				]
			});

			// Process weekly logs
			const daysOfWeek = [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thur",
				"Fri",
				"Sat"
			];
			const getDateForDay = (dayName) => {
				const today = new Date();
				const currentDayIndex = today.getDay(); // 0 (Sunday) to 6 (Saturday)
				const targetDayIndex = daysOfWeek.indexOf(dayName); // Get index of the target day
				const difference = targetDayIndex - currentDayIndex;

				// Calculate the target date
				const targetDate = new Date();
				targetDate.setDate(today.getDate() + difference);

				// Format the date as YYYY-MM-DD
				return targetDate.toISOString().split("T")[0];
			};
			const formattedWeeklyLogs = daysOfWeek.map((day) => {
				const log = weeklyLogs.find(
					(entry) => entry.dataValues.dayName === day
				);
				return log
					? log.dataValues
					: {
							dayName: day,
							date: getDateForDay(day),
							weight: null,
							height: null,
							results: null
					  };
			});

			// Get average BMI for the past six months
			const generateMonths = (start, end) => {
				const months = [];
				const current = moment(start).startOf('month');

				while (current.isSameOrBefore(end, 'month')) {
				  months.push(current.format('MMM-YYYY'));
				  current.add(1, 'month');
				}

				return months;
			  };

			// Retrieve average blood sugar level for the past six months
			const sixMonthsAgo = moment().subtract(5, 'months').startOf('month').toDate();
            const todays = moment().endOf('month').toDate();
            const allMonths = generateMonths(sixMonthsAgo, todays);

			const monthlyAverages = await NBmiLog.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: allMonths,
						[Op.lte]: today
					}
				},
				attributes: [
					[fn("DATE_FORMAT", col("created_at"), "%b-%Y"), "month"],
					[fn("AVG", col("weight")), "avg_weight"],
					[fn("AVG", col("height")), "avg_height"],
					[fn("AVG", col("results")), "avg_results"]
				],
				group: [literal("month")],
				order: [[col("created_at"), "ASC"]]
			});

			const monthlyDataMap = monthlyAverages.reduce((acc, record) => {
				acc[record.dataValues.month] = {
					avg_weight: parseFloat(record.dataValues.avg_weight),
					avg_height: parseFloat(record.dataValues.avg_height),
					avg_results: parseFloat(record.dataValues.avg_results),
				};
				return acc;
			  }, {});

			  const completeMonthlyData = allMonths.map((month) => ({
				month,
				avg_weight: monthlyDataMap[month]?.avg_weight || 0,
				avg_height: monthlyDataMap[month]?.avg_height || 0,
				avg_results: monthlyDataMap[month]?.avg_results || 0,
			  }));

			res.json({
				success: true,
				message: "User BMI logs retrieved successfully",
				data: {
					weekly: formattedWeeklyLogs,
					sixMonthly: completeMonthlyData,
					user_id: user_id
				}
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error retrieving BMI logs"
			});
		}
	}
);

router.get(
	"/get_blood_sugar_filter",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;
			let decoded_user_id = base64.decode(user_id);

			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay());

			// Retrieve hourly blood sugar data for today
			const hourlyLogs = await NBloodSugar.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: moment().startOf("day").toDate(),
						[Op.lte]: moment().endOf("day").toDate()
					}
				},
				attributes: [
					[fn("DATE_FORMAT", col("created_at"), "%Y-%m-%d %H:00:00"), "hour"],
					[fn("ROUND", fn("AVG", col("level")), 1), "avg_level"]
					// [fn("MIN", col("level")), "min_level"],
					// [fn("MAX", col("level")), "max_level"]
				],
				group: [literal("hour")],
				order: [[col("created_at"), "ASC"]]
			});

			// Process hourly logs for today
			const formattedHourlyLogs = hourlyLogs.map((log) => {
				return {
					hour: log.dataValues.hour,
					avg_level: log.dataValues.avg_level,
					min_level: log.dataValues.min_level,
					max_level: log.dataValues.max_level
				};
			});

			// Retrieve weekly blood sugar averages
			const weeklyLogs = await NBloodSugar.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: startOfWeek,
						[Op.lte]: today
					}
				},
				attributes: [
					[fn("DAYNAME", col("created_at")), "dayName"],
					[fn("DATE", col("created_at")), "date"],
					"level",
					"condition"
				]
			});

			// Process weekly logs
			const daysOfWeek = [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thu",
				"Fri",
				"Sat"
			];

			const getDateForDay = (dayName) => {
				const today = new Date();
				const currentDayIndex = today.getDay(); // 0 (Sunday) to 6 (Saturday)
				const targetDayIndex = daysOfWeek.indexOf(dayName); // Get index of the target day
				const difference = targetDayIndex - currentDayIndex;

				// Calculate the target date
				const targetDate = new Date();
				targetDate.setDate(today.getDate() + difference);

				// Format the date as YYYY-MM-DD
				return targetDate.toISOString().split("T")[0];
			};
			const formattedWeeklyLogs = daysOfWeek.map((day) => {
				const log = weeklyLogs.find(
					(entry) => entry.dataValues.dayName === day
				);
				return log
					? log.dataValues
					: { dayName: day, date: getDateForDay(day), level: null, condition: null };
			});

			// Retrieve average blood sugar level for the past six months
			const generateMonths = (start, end) => {
				const months = [];
				const current = moment(start).startOf('month');

				while (current.isSameOrBefore(end, 'month')) {
				  months.push(current.format('MMM-YYYY'));
				  current.add(1, 'month');
				}

				return months;
			  };

			// Retrieve average blood sugar level for the past six months
			const sixMonthsAgo = moment().subtract(5, 'months').startOf('month').toDate();
            const todays = moment().endOf('month').toDate();
            const allMonths = generateMonths(sixMonthsAgo, todays);

			const monthlyAverages = await NBloodSugar.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: sixMonthsAgo,
						[Op.lte]: today
					}
				},
				attributes: [
					[fn("DATE_FORMAT", col("created_at"), "%b-%Y"), "month"],
					[fn("ROUND", fn("AVG", col("level")), 1), "avg_level"]
				],
				group: [literal("month")],
				order: [[col("created_at"), "ASC"]]
			});

			const monthlyDataMap = monthlyAverages.reduce((acc, record) => {
				acc[record.dataValues.month] = {
					avg_level: parseFloat(record.dataValues.avg_level),
				};
				return acc;
			  }, {});

			  const completeMonthlyData = allMonths.map((month) => ({
				month,
				avg_level: monthlyDataMap[month]?.avg_level || 0,
			  }));

			res.json({
				success: true,
				message: "User blood sugar logs retrieved successfully",
				data: {
					hourly: formattedHourlyLogs,
					weekly: formattedWeeklyLogs,
					sixMonthly: completeMonthlyData,
					user_id: user_id
				}
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				success: false,
				message: "Error retrieving blood sugar logs"
			});
		}
	}
);
router.get(
	"/get_blood_pressure_filter",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			let user_id = req.query.user_id;
			let decoded_user_id = base64.decode(user_id);

			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay());

			// Retrieve hourly blood pressure data for today
			const hourlyLogs = await NBloodPressure.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: moment().startOf("day").toDate(),
						[Op.lte]: moment().endOf("day").toDate()
					}
				},
				attributes: [
					[fn("DATE_FORMAT", col("created_at"), "%Y-%m-%d %H:00:00"), "hour"],
					[fn("ROUND", fn("AVG", col("systolic")), 1), "avg_systolic"],
					[fn("ROUND", fn("AVG", col("diastolic")), 1), "avg_diastolic"],
					[fn("ROUND", fn("AVG", col("pulse_rate")), 1), "pulse_rate"]
				],
				group: [literal("hour")],
				order: [[col("created_at"), "ASC"]]
			});

			// Process hourly logs for today
			const formattedHourlyLogs = hourlyLogs.map((log) => {
				return {
					hour: log.dataValues.hour,
					avg_systolic: log.dataValues.avg_systolic,
					min_systolic: log.dataValues.min_systolic,
					max_systolic: log.dataValues.max_systolic,
					avg_diastolic: log.dataValues.avg_diastolic,
					min_diastolic: log.dataValues.min_diastolic,
					max_diastolic: log.dataValues.max_diastolic,
					pulse_rate: log.dataValues.pulse_rate,
					pulse_rate: log.dataValues.pulse_rate,
					pulse_rate: log.dataValues.pulse_rate
				};
			});

			// Retrieve weekly blood pressure averages
			const weeklyLogs = await NBloodPressure.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: startOfWeek,
						[Op.lte]: today
					}
				},
				attributes: [
					[fn("DAYNAME", col("created_at")), "dayName"],
					[fn("DATE", col("created_at")), "date"],
					"systolic",
					"diastolic",
					"pulse_rate"
				]
			});

			// Process weekly logs
			const daysOfWeek = [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thur",
				"Fri",
				"Sat"
			];

			const getDateForDay = (dayName) => {
				const today = new Date();
				const currentDayIndex = today.getDay(); // 0 (Sunday) to 6 (Saturday)
				const targetDayIndex = daysOfWeek.indexOf(dayName); // Get index of the target day
				const difference = targetDayIndex - currentDayIndex;

				// Calculate the target date
				const targetDate = new Date();
				targetDate.setDate(today.getDate() + difference);

				// Format the date as YYYY-MM-DD
				return targetDate.toISOString().split("T")[0];
			};
			const formattedWeeklyLogs = daysOfWeek.map((day) => {
				const log = weeklyLogs.find(
					(entry) => entry.dataValues.dayName === day
				);
				return log
					? log.dataValues
					: {
							dayName: day,
							date: getDateForDay(day),
							systolic: null,
							diastolic: null,
							pulse_rate: null
					  };
			});

			const generateMonths = (start, end) => {
				const months = [];
				const current = moment(start).startOf('month');

				while (current.isSameOrBefore(end, 'month')) {
				  months.push(current.format('MMM-YYYY'));
				  current.add(1, 'month');
				}

				return months;
			  };

			// Retrieve average blood sugar level for the past six months
			const sixMonthsAgo = moment().subtract(5, 'months').startOf('month').toDate();
            const todays = moment().endOf('month').toDate();
            const allMonths = generateMonths(sixMonthsAgo, todays);

			const monthlyAverages = await NBloodPressure.findAll({
				where: {
					user_id: decoded_user_id,
					created_at: {
						[Op.gte]: sixMonthsAgo,
						[Op.lte]: today
					}
				},
				attributes: [
					[fn("DATE_FORMAT", col("created_at"), "%b-%Y"), "month"],
					[fn("ROUND", fn("AVG", col("systolic")), 1), "avg_systolic"],
					[fn("ROUND", fn("AVG", col("diastolic")), 1), "avg_diastolic"],
					[fn("ROUND", fn("AVG", col("pulse_rate")), 1), "avg_pulse_rate"]
				],
				group: [literal("month")],
				order: [[col("created_at"), "ASC"]]
			});
			const monthlyDataMap = monthlyAverages.reduce((acc, record) => {
				acc[record.dataValues.month] = {
				  avg_systolic: parseFloat(record.dataValues.avg_systolic),
				  avg_diastolic: parseFloat(record.dataValues.avg_diastolic),
				  avg_pulse_rate: parseFloat(record.dataValues.avg_pulse_rate),
				};
				return acc;
			  }, {});

			  const completeMonthlyData = allMonths.map((month) => ({
				month,
				avg_systolic: monthlyDataMap[month]?.avg_systolic || 0,
				avg_diastolic: monthlyDataMap[month]?.avg_diastolic || 0,
				avg_pulse_rate: monthlyDataMap[month]?.avg_pulse_rate || 0,
			  }));

			res.json({
				success: true,
				message: "User blood pressure logs retrieved successfully",
				data: {
					hourly: formattedHourlyLogs,
					weekly: formattedWeeklyLogs,
					sixMonthly: completeMonthlyData,
					user_id: user_id
				}
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				success: false,
				message: "Error retrieving blood pressure logs"
			});
		}
	}
);

router.get(
	"/fetch-patient",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const { identifierType, identifierNumber } = req.query;

		if (!identifierType || !identifierNumber) {
			return res
				.status(400)
				.json({
					error:
						"identifierType and identifierNumber are required query parameters."
				});
		}

		try {
			// Step 1: Generate token
			const authResponse = await axios.get(
				process.env.PATIENT_REGISTRY_TOKEN_URL,
				{
					auth: {
						username: process.env.PATIENT_REGISTRY_TOKEN_USERNAME,
						password: process.env.PATIENT_REGISTRY_TOKEN_PASSWORD
					}
				}
			);
			const token = authResponse.data.token;

			// Step 2: Use the token to fetch patient data
			const fhirResponse = await axios.get(`${process.env.PATIENT_REGISTRY_URL}?identifierType=${identifierType}&identifierNumber=${encodeURIComponent(identifierNumber)}`
,
				{
					headers: {
						Authorization: `Bearer ${authResponse.data}`,
						Accept: "application/json",
                       "Content-Type": "application/json"
					}
				}
			);

			const patientData = fhirResponse.data.entry[0]?.resource;


			if (!patientData) {
				return res.status(404).json({ error: "Patient data not found." });
			}

			// Step 3: Extract required fields
			const shaNumber = patientData.identifier.find(
				(id) => id.type.coding[0].code === "sha-number"
			)?.value;
			const name = patientData.name[0]?.text;
			const gender = patientData.gender;
			const birthDate = patientData.birthDate;
			const maritalStatus = patientData.maritalStatus?.coding[0]?.display;
			const phone_no = patientData.telecom[1]?.value;

			// Step 4: Construct the output JSON
			const result = {
				shaNumber,
				name,
				gender,
				birthDate,
				maritalStatus,
				phone_no
			};

			return res.json({
				success: true,
				message: "SHA Records Retrieved Successfully",
				data: result
			});
		} catch (error) {
			// console.error("Error fetching patient data:", error.message);
			// console.error("Full error:", error.response?.data || error);
			return res.status(500).json({
				error: "An error occurred while fetching patient data."
			});
		}

	}
);

// API route to fetch practitioner data by national ID
router.post(
	"/practitioner",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		let { nationalId, user_id } = req.body;

		try {
			let user = await NUsers.findOne({
				where: { id: base64.decode(user_id) }
			});

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			let response = await axios.get(
				`${process.env.HIE_ENDPOINT}?national-id=${nationalId}`,
				{
					auth: {
						username: process.env.HIE_USERNAME,
						password: process.env.HIE_PASSWORD
					}
				}
			);

			let practitioner = response.data;

			let existing_provider = await NProvider.findOne({
				where: {
					user_id: base64.decode(user_id)
				}
			});

			let cadre = practitioner.extension.find(
				(ext) =>
					ext.url ===
					"https://shr.tiberbuapps.com/fhir/StructureDefinition/professional-cadre"
			).valueCoding.display;
			let nationalIdValue = practitioner.identifier.find((id) =>
				id.type.coding.some((code) => code.display === "National ID")
			).value;
			let boardNo = practitioner.identifier.find((id) =>
				id.type.coding.some(
					(code) => code.display === "Board Registration Number"
				)
			).value;
			let status = practitioner.active;
			let { family, given, prefix } = practitioner.name[0];
			let gender = practitioner.gender;
			let currentLicenseNumber = practitioner.qualification[0].extension.find(
				(ext) =>
					ext.url ===
					"https://shr.tiberbuapps.com/fhir/StructureDefinition/current-license-number"
			).valueString;

			let providerData = {
				family_name: family,
				given_name: given.join(" "),
				salutation: prefix ? prefix.join(" ") : null,
				national_id: nationalIdValue,
				license_number: currentLicenseNumber,
				board_number: boardNo,
				cadre,
				gender,
				user_id: base64.decode(user_id)
			};

			if (existing_provider) {
				await NProvider.update(providerData, {
					where: {
						user_id: base64.decode(user_id)
					}
				});
				return res.status(200).json({
					success: true,
					message: "Provider details updated successfully",
					provider: await NProvider.findOne({
						where: { user_id: base64.decode(user_id) }
					})
				});
			} else {
				let provider = await NProvider.create(providerData);

				res.status(200).json({
					message: "Provider saved successfully",
					provider: await NProvider.findOne({
						where: { user_id: base64.decode(user_id) }
					})
				});
			}
		} catch (error) {
			let practitioner = error.response.data;
			if (practitioner.resourceType === "OperationOutcome") {
				let errorMessage = practitioner.issue[0].diagnostics;
				let errorCode = error.response.data.issue[0].code;
				return res.status(400).json({ code: errorCode, message: errorMessage });
			}
			res.status(500).json({ message: "Internal server error" });
		}
	}
);

router.post("/save_screening_form", async (req, res) => {
	try {
	  const { name, description, version, published, uuid, retired, encounter, pages, encounterType } = req.body;

	  const formData = await ScreeningForm.create({
		name,
		description,
		version,
		published,
		uuid,
		retired,
		encounter,
		json_data: pages,
		encounter_type: encounterType,

	  });

	  console.log("This works", formData);

	  res.status(200).json({ message: "Form saved successfully", data: formData });
	} catch (error) {
	  res.status(500).json({ message: "Error saving form", error: error.message });
	}
  });

  router.get("/get_screening_form", async (req, res) => {
	try {
	  const form = await ScreeningForm.findOne();
	  if (!form) return res.status(404).json({ message: "Form not found" });

	  res.json({
		name: form.name,
		description: form.description,
		version: form.version,
		published: form.published,
		uuid: form.uuid,
		retired: form.retired,
		encounter: form.encounter,
		pages: typeof form.json_data === "string" ? JSON.parse(form.json_data) : form.json_data,
		encounterType: form.encounter_type
	  });
	} catch (error) {
	  res.status(500).json({ message: "Error fetching form", error: error.message });
	}
  });

  router.post("/post_screening_quiz", async (req, res) => {
	try {
		const { patient_id, provider_id, location_id, encounter_date, notes, questions } = req.body;

		if (!patient_id || !provider_id || !location_id || !Array.isArray(questions)) {
		  return res.status(400).json({ message: "Invalid input data" });
		}

		// Create an encounter record
		const encounter = await CPMEncounter.create({
		  patient_id,
		  provider_id,
		  location_id,
		  encounter_date,
		  notes,
		});

		// Prepare responses for bulk insert
		const responses = questions.map((q) => ({
		  encounter_id: encounter.id,
		  question: q.question,
		  concept_id: q.concept_id,
		  answer: q.answer,
		}));
		// Save encounter responses
		await CPMObservation.bulkCreate(responses);

		res.status(200).json({ message: "Encounter saved successfully", encounter_id: encounter.id });
	  } catch (error) {
		console.error("Error saving encounter:", error);
		res.status(500).json({ message: "Server error" });
	  }
	});

	router.post("/prescriptions", async (req, res) => {
		try {
			const prescriptions = req.body;

			if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
				return res.status(400).json({ error: "Invalid request: Must provide an array of prescriptions" });
			}

			const newPrescriptions = [];
			const fhirPrescriptions = [];

			for (const prescription of prescriptions) {
				const {
					patient_id,
					drug_name,
					unit,
					duration,
					medicine_time,
					to_be_taken,
					prescription_notes,
					appointment_id
				} = prescription;

				if (!patient_id || !drug_name || !unit || !duration || !medicine_time || !to_be_taken) {
					return res.status(400).json({ error: "Missing required fields in one or more prescriptions" });
				}

				const fhirPrescription = {
					resourceType: "MedicationRequest",
					status: "active",
					intent: "order",
					medicationCodeableConcept: {
						text: `${drug_name} ${unit}`
					},
					subject: {
						reference: `Patient/${patient_id}`
					},
					authoredOn: new Date().toISOString(),
					dosageInstruction: [
						{
							text: `Take ${drug_name} ${unit}, ${medicine_time.join(", ")} - ${to_be_taken}`,
							timing: {
								repeat: {
									frequency: medicine_time.length,
									period: 1,
									periodUnit: "d",
									timeOfDay: medicine_time
								}
							},
							doseAndRate: [
								{
									doseQuantity: {
										value: unit.replace(/[^0-9]/g, ""),
										unit: unit.replace(/[0-9]/g, ""),
										system: "http://unitsofmeasure.org"
									}
								}
							],
							additionalInstruction: [{ text: to_be_taken }]
						}
					],
					dispenseRequest: {
						validityPeriod: {
							start: new Date().toISOString(),
							end: new Date(new Date().setDate(new Date().getDate() + duration * 7)).toISOString()
						},
						expectedSupplyDuration: {
							value: duration,
							unit: "weeks",
							system: "http://unitsofmeasure.org"
						}
					},
					note: [
						{
							text: prescription_notes
						}
					]
				};

				const newPrescription = await CPMPrescription.create({
					patient_id,
					drug_name,
					unit,
					duration,
					medicine_time: medicine_time.join(", "),
					to_be_taken,
					prescription_notes,
					appointment_id,
					fhir_data: JSON.stringify(fhirPrescription)
				});

				newPrescriptions.push(newPrescription);
				fhirPrescriptions.push(fhirPrescription);
			}

			return res.status(200).json({
				message: "Prescriptions created successfully",
				success: true,
				drug_prescriptions: fhirPrescriptions
			});

		} catch (error) {
			console.error("Error creating prescriptions:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	});

module.exports = router;
//module.exports = { router, users };
