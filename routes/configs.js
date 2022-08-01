const { ServerConfig } = require("../models/server_conf");
const express = require("express");
const router = express.Router();
const _ = require("lodash");

router.get("/", async (req, res) => {
  let conf = await ServerConfig.findAll();
  if (!conf) return res.status(400).send("No configs found");
  res.send(
    conf
  );
});

module.exports = router;
