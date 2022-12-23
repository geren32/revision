const express = require("express");
const router = express.Router();
const npController = require("../controllers/np.contorller");
const  validateToken  = require('../middlewares/user.validate.token.middleware');

// router.use(validateToken)

router

    .post('/getAllCities',npController.getAllCities)

    .post('/getSections',npController.getSections)

module.exports = router;
