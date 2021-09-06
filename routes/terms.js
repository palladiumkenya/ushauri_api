const express = require("express");
const router = express.Router();
const fs = require('fs')

router.get("/", async (req, res) => {
  fs.readFile('routes/terms.txt', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    res.send(data );
  })
});

module.exports = router;
