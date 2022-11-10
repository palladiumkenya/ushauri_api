const express = require("express");
const app = express();
const bodyParser = require("body-parser");
require("express-async-errors");
require("dotenv").config();

// const users = require("./routes/users");
const clients = require("./routes/clients");
const app_diary = require("./routes/appointment_diary");
const cleaner = require("./routes/cleaner");
const verify = require("./routes/processes/verify_mflcode");
const todaysAppointments = require("./routes/processes/process_today_appointment");
const pastAppointments = require("./routes/processes/process_past_appointment");
const sender = require("./routes/processes/sender");
const verifyupi = require("./routes/processes/upiverify");
const locator_info = require("./routes/processes/locator");
const mlab = require("./routes/processes/mlab");
const dfc = require("./routes/processes/process_dfc");
const pmtct = require("./routes/processes/process_pmtct");
const editApps = require("./routes/processes/edit_appointment");
const terms = require("./routes/terms");
const conf = require("./routes/configs");
// app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//verify upi 
app.use('/mohupi',verifyupi);
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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Ushauri Web App started. Listening on Port: ${PORT}`)
);
