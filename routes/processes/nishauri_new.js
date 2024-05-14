const express = require("express");
const router = express.Router();

const request = require("request");
const https = require("https");
const moment = require("moment");
const base64 = require("base64util");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const jwt = require("jsonwebtoken");
const passport = require("passport");
const { Buffer } = require("buffer");

const users = [];

module.exports = { router, users };
require("dotenv").config();
//const Op = require("sequelize");
const { Op } = require("sequelize");
var bcrypt = require("bcrypt");

//const Sequelize = require("sequelize");

//const Sequelize = require('sequelize');

require("dotenv").config();
//var mysql = require("mysql");
const mysql = require("mysql2");
const { NUsers } = require("../../models/n_users");
const { NUserprograms } = require("../../models/n_user_programs");

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

generateOtp = function (size) {
	const zeros = "0".repeat(size - 1);
	const x = parseFloat("1" + zeros);
	const y = parseFloat("9" + zeros);
	const confirmationCode = String(Math.floor(x + Math.random() * y));
	return confirmationCode;
};

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
			is_active: 0,
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

			if (new_profile) {
				const token = jwt.sign(
					{ userId: new_user.id, username: new_user.username },
					process.env.JWT_SECRET,
					{ expiresIn: "3h" }
				);

				return res.status(200).json({
					success: true,
					msg: "Signup successfully",
					data: {
						token: token,
						user_id: base64.encode(new_user.id), // Use the decoded user ID
						account_verified: new_user.is_active
					}
				});
			} else {
				// Log the error for debugging
				console.error("Error creating user profile");
				return res.status(500).json({
					success: false,
					msg: "Error creating user profile"
				});
			}
		} else {
			// Log the error for debugging
			console.error("Error creating user");
			return res.status(500).json({
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

//Sign-In Users
router.post("/signin", async (req, res) => {
	let vusername = req.body.user_name;
	let password_1 = req.body.password;
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

	//console.log(check_username.password);

	if (check_username) {
		var password_hash = check_username.password;
		//console.log(password_hash);
		const verified = bcrypt.compareSync(password_1, password_hash);
		if (verified) {
			if (check_username.is_active === "0") {
				const token = jwt.sign(
					{ username: check_username.id },
					process.env.JWT_SECRET,
					{
						expiresIn: "3h"
					}
				);
				//Log Login Date
				var l = {
					user_id: base64.encode(check_username.id),
					page_id: 0,
					token: token,
					account_verified: check_username.is_active
				};

				return res.status(200).json({
					success: true,
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
						{ last_login: today },
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
						account_verified: check_username.is_active
					};
					return res.status(200).json({
						success: true,
						msg: "Signin successfully",
						data: l
					});
				} catch (err) {
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
			return res.status(500).json({
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
		let check_username = await NUsers.findOne({
			where: {
				[Op.and]: [{ id: base64.decode(user_id) }]
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

			//User Is Not Active
			//Validate Program In HIV
			let check_program_valid = await Client.findOne({
				where: { clinic_number: ccc_no }
			});

			if (check_program_valid) {
				if (
					check_program_valid.f_name.toUpperCase() !== firstname.toUpperCase()
				) {
					return res.status(200).json({
						success: false,
						msg: `Invalid CCC Number: ${ccc_no}, The CCC Number does not match in Nishauri`
					});
				}
			}

			let check_valid_user = await Client.findOne({
				where: {
					[Op.and]: [{ f_name: firstname }, { clinic_number: ccc_no }]
				}
			});

			if (!check_valid_user) {
				return res.status(200).json({
					success: false,
					msg: `Invalid CCC Number/ First Name Match: ${ccc_no}, The CCC Number/First Name does not match in Nishauri`
				});
			}

			if (check_username) {
				//User Account Not Active- Show Page to Enter Program Indentification Details
				//Search if Program Details Exist
				let check_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ program_identifier: check_program_valid.id },
							{ user_id: base64.decode(user_id) },
							{ program_type: "1" } // Set 1 for HIV program
						]
					}
				});

				if (!check_program) {
					//Update Login & Active Login

					const log_active_login = await NUsers.update(
						{ is_active: "1" },
						{ where: { id: base64.decode(user_id) } }
					);
					//Save Program Details If Exist
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
							msg: "Program Registration Succesfully."
						});
					} else {
						return res.status(200).json({
							success: false,
							msg: "An error occurred, could not create program record"
						});
					}
				} else if (existing_other_program) {
					const update_program = await NUserprograms.update(
						{ is_active: "1" },
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
				//Show Error Message
				return res.status(200).json({
					success: false,
					msg: "Program registration record already exists"
				});
			}
		} else {
			// other programs set up
			if (check_username) {
				//Search if Program Details Exist
				let check_other_program = await NUserprograms.findOne({
					where: {
						[Op.and]: [
							{ user_id: base64.decode(user_id) },
							{ program_type: program_id } // for other programs
						]
					}
				});

				if (!check_other_program) {
					//Update Login & Active Login

					const log_active_login = await NUsers.update(
						{ is_active: "1" },
						{ where: { id: base64.decode(user_id) } }
					);
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
							msg: "Program Registration Succesfully"
						});
					} else {
						return res.status(200).json({
							success: false,
							msg: "An error occurred, could not create program record"
						});
					}
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
					return res.status(200).json({
						success: true,
						msg: "Program Already Exist Succesfully."
					});
				}
			} else {
				//Show Error Message
				return res.status(200).json({
					success: false,
					msg: "Program registration record already exists"
				});
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
				proposed_date: moment(proposed_date_, "DD/MM/YYYY").format(
					"YYYY-MM-DD"
				),
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
							var viral_load__ = "Viral Suppressed";
						} else {
							var viral_load__ = "Viral Unsuppressed";
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
				return res.status(500).json({
					success: false,
					msg: "No VL Records Found"
				});
			}
		} else {
			return res.status(500).json({
				success: false,
				msg: "No VL Records Found"
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
						obj_.message === "No results for the given CCC Number were found"
					) {
						sp_status.push("No VL Results Found");
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
												status: "Viral Suppressed",
												date: lab_order_date_,
												plot: parseInt(49)
											});
											//console.log(sp_status);
										} else {
											if (value_.replace(/[^0-9]/g, "") < 200) {
												sp_status.push({
													result: value_.replace(/[^0-9]/g, "") + " copies/ml",
													status: "Viral Suppressed",
													date: lab_order_date_,
													plot: parseInt(value_.replace(/[^0-9]/g, ""))
												});
											} else {
												sp_status.push({
													result: value_.replace(/[^0-9]/g, "") + " copies/ml",
													status: "Viral unsuppressed",
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
					msg: "No VL Records Found"
				});
			}
		} else {
			return res.status(500).json({
				success: false,
				msg: "No VL Records Found"
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
					success: true,
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

module.exports = router;
//module.exports = { router, users };
