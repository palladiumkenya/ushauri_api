const { User } = require("../../models/user");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  const phone = req.body.phone_no;

  //check user phone number and mfl_code and clinic

  let user = await User.findOne({ where: { phone_no: phone } });

  if (!user)
    res
      .status(400)
      .send(`Phone Number: ${phone} is not registered in the system`);
  let result = {};
  result.result = [{ mfl_code: user.facility_id }];
  res.status(200).send(result);
});
module.exports = router;
