const express = require("express");
const router = express.Router();
const { Appointment } = require("../models/appointment");
const moment = require("moment");
const Sequelize = require("sequelize");
// const sequelize = require("../db_config");
const Op = Sequelize.Op;

router.get("/", async (req, res) => {
  const sequelize = new Sequelize("ushauri_new", "chris", "Chris1234", {
    host: "192.168.50.2",
    port: 3307,
    dialect: "mysql"
  });

  sequelize
    .query(
      "SELECT id,client_id,appntmnt_date,created_at,app_status,visit_type,no_calls,unscheduled_date,fnl_outcome_dte,fnl_trcing_outcome,date_attended,active_app,appointment_kept  FROM tbl_appointment WHERE DATE(date_attended) = DATE(appntmnt_date) AND no_calls > 0 ORDER BY appntmnt_date DESC"
    )
    .then(async ([results, metadata]) => {
      for (let i = 0; i < results.length; i++) {
        let app_id = results[i].id;
        let client_id = results[i].client_id;

        let next_app = await Appointment.findOne({
          raw: true,
          where: {
            client_id: client_id,
            id: {
              [Op.gt]: results[i].id
            }
          },
          order: [["id", "ASC"]]
        });

        if (next_app) {
          let this_app_date = moment(results[i].appntmnt_date);
          let next_app_created = moment(next_app.createdAt);

          if (next_app_created > this_app_date) {
            let days_diff = this_app_date.diff(next_app_created, "days");
            if (days_diff > 30) {
              if (results[i].app_status != "LTFU") {
                Appointment.update(
                  {
                    app_status: "LTFU",
                    date_attended: next_app_created
                  },
                  {
                    where: {
                      id: results[i].id
                    }
                  }
                );
              }
            } else if (days_diff > 5 && days_diff <= 30) {
              if (results[i].app_status != "Defaulted") {
                Appointment.update(
                  {
                    app_status: "Defaulted",
                    date_attended: next_app_created
                  },
                  {
                    where: {
                      id: results[i].id
                    }
                  }
                );
              }
            } else if (days_diff > 0 && days_diff <= 4) {
              if (results[i].app_status != "Missed") {
                Appointment.update(
                  {
                    app_status: "Missed",
                    date_attended: next_app_created
                  },
                  {
                    where: {
                      id: results[i].id
                    }
                  }
                );
              }
            } else {
              if (results[i].app_status != "Notified") {
                Appointment.update(
                  {
                    app_status: "Notified"
                  },
                  {
                    where: {
                      id: results[i].id
                    }
                  }
                );
              }
            }
          }
        } else {
          console.log("not there");
        }
      }
    });
});

module.exports = router;
