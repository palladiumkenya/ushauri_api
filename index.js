const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("express-async-errors");
require("dotenv").config();
const passport = require('passport');
require('./passport-config')(passport);

// const users = require("./routes/users");
const clients = require("./routes/clients");
const app_diary = require("./routes/appointment_diary");
const cleaner = require("./routes/cleaner");
const verify = require("./routes/processes/verify_mflcode");
const todaysAppointments = require("./routes/processes/process_today_appointment");
const pastAppointments = require("./routes/processes/process_past_appointment");
const sender = require("./routes/processes/sender");
const verifyupi = require("./routes/processes/upiverify");
const calendarupi = require("./routes/processes/calendar");
const pmtct_new = require("./routes/processes/pmtct");
const nishauri_new = require("./routes/processes/nishauri");
const nishauri_new_v2 = require("./routes/processes/nishauri_new");
const locator_info = require("./routes/processes/locator");
const mlab = require("./routes/processes/mlab");
const dfc = require("./routes/processes/process_dfc");
const pmtct = require("./routes/processes/process_pmtct");
const editApps = require("./routes/processes/edit_appointment");
const terms = require("./routes/terms");
const conf = require("./routes/configs");
const provider = require("./routes/users");
const cases = require("./routes/processes/case");
const visit = require("./routes/processes/visit");

// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


//verify upi
app.use('/mohupi',verifyupi);
//verify upi
app.use('/appnt',calendarupi);

//PMTCT Module
app.use('/pmtct',pmtct_new);
//Visit Encounter Module
app.use('/visit',visit);
//Nishauri Module
app.use('/nishauri',nishauri_new);


app.use('/nishauri_new',nishauri_new_v2);


//locator information
app.use('/locator',locator_info);

app.use("/clients", clients);
//moves appointments to defaulter diary
app.use("/cleaner", cleaner);
app.use("/sender", sender);
//process appointment diary functions and requests
app.use("/receiver", app_diary);
//verify that mflcode exists
app.use("/verifyMFLCode", verify);
//process pull today's appointments
app.use("/today_appointments", todaysAppointments);
//process defaulters appointments
app.use("/past_appointments", pastAppointments);
//apis for mlab integration
app.use("/api/mlab", mlab);
//process dfc module requests
app.use("/api/process_dfc", dfc);
//process pmtct module requests
app.use("/api/process_pmtct", pmtct)
//edit existing appointments requests
app.use("/api/edit_appointment", editApps)
//terms and conditions
app.use("/terms", terms)
//configs
app.use("/config", conf)
//pull case managers
app.use("/user", provider)
// assign cases
app.use("/case", cases)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Ushauri Web App started. Listening on Port: ${PORT}`)
);
