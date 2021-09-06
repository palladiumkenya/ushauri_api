const { validateUser, User } = require("../models/user");
const express = require("express");
const router = express.Router();
// const bcrypt = require("bcrypt");
const _ = require("lodash");

router.get("/", async (req, res) => {
  let users = await User.findAll();
  if (!users) return res.status(400).send("No Users found");
  res.send(
    users.map(
      ({
        f_name,
        m_name,
        l_name,
        dob,
        phone_no,
        email,
        partner_id,
        facility_id,
        status,
        clinic_id,
        createdAt
      }) => ({
        f_name,
        m_name,
        l_name,
        dob,
        phone_no,
        email,
        partner_id,
        facility_id,
        status,
        clinic_id,
        createdAt
      })
    )
  );
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const user = await User.findByPk(id);

  if (!user)
    return res.status(400).send(`User with the given id: ${id} was not found`);
  res.send(
    _.pick(user, [
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
  );
});

router.post("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({
    where: {
      phone_no: req.body.phone_no
    }
  });

  // return res.send(_.isEmpty(user));

  if (!_.isEmpty(user))
    return res
      .status(400)
      .send(`Phone number: ${req.body.phone_no} already exists in the system.`);

  user = await User.findOne({
    where: {
      email: req.body.email
    }
  });

  if (!_.isEmpty(user))
    return res
      .status(400)
      .send(`Email: ${req.body.email} already exists in the system.`);

  user = req.body;
  // const salt = await bcrypt.genSalt(10);
  // user.password = await bcrypt.hash(user.phone_no, salt);

  user.first_access = "Yes";
  if ((user.access_level = "Admin")) {
    user.partner_id = 100;
    user.role_id = 1;
    user.rcv_app_list = "No";
  }

  User.create(user)
    .then(function(model) {
      message = "OK";
      response = "User successfully added.";

      res.json({
        message: message,
        response: {
          msg: response,
          user: _.pick(user, [
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
    .catch(function(err) {
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
  let user = await User.findByPk(req.params.id);

  if (!user)
    return res
      .status(400)
      .send(`User with the given id: ${req.params.id} was not found`);

  User.update(req.body, { returning: true, where: { id: req.params.id } })
    .then(function([rowsUpdate, [updatedUser]]) {
      message = "OK";
      response = "User successfully updated.";

      res.json({
        message: message,
        response: {
          msg: response,
          user: _.pick(updatedUser, [
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
    .catch(function(err) {
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
  let user = await User.findByPk(req.params.id);

  if (!user)
    return res
      .status(400)
      .send(`User with the given id: ${req.params.id} was not found`);

  User.destroy({
    where: { id: req.params.id }
  })
    .then(deletedUser => {
      message = "OK";
      response = "User successfully deleted.";
      res.json({
        message: message,
        response: {
          msg: response,
          user: deletedUser
        }
      });
    })
    .catch(function(err) {
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

module.exports = router;
