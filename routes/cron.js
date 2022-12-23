const express = require("express");
const router = express.Router();
const cronController = require("../controllers/cron-controller");

router

    .get('/cronOrderFileToMail/:key',cronController.cronOrderFileToMail)

    .get('/courtStatus',cronController.cronCourtStatus)


module.exports = router;
