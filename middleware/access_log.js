const path = require("path");
const fs = require("fs");
const rfs = require("rotating-file-stream");
const logDirectory = path.join(__dirname, "../logs");

// ensure log directory exists

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// create a rotating write stream
const accessLogStream = async () => {
  rfs("access.log", {
    interval: "1d", // rotate daily
    path: logDirectory
  });
};

module.exports = accessLogStream;
