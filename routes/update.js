const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

router.get("/", async (req, res) => {
  let users = await User.findAll({
    where: {
      password: {
        [Op.eq]: null
      }
    }
  });

  if (!users) return res.status(400).send("No Users found");

  for (let i = 0; i < users.length; i++) {
    let phone = users[i].phone_no;

    const salt = await bcrypt.genSalt(10);
    let password = await bcrypt.hash(phone, salt);

    // console.log(password);
    User.update(
      { password: password },
      { returning: true, where: { id: users[i].id } }
    )
      .then(() => {
        console.log("Updated");
      })
      .catch(err => {
        console.log("Error:", err.message);
      });
  }
});

module.exports = router;
