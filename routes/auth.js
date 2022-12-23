const express = require("express");
const router = express.Router();
const passport = require("passport");
const controller = require("../controllers/auth.controller");


router


  //-------------------------------------------------
  .get("/login", controller.loginPage)

  .get("/register", controller.registerPage)

  .get("/register/success", controller.registerPageSuccess)

  .post("/register", controller.registerNewClient)
  
  .post("/login", controller.userLogin)

  .get("/logout", controller.logout)

  .get('/recover_password', controller.recoverPasswordPage)

  .post('/recover_password', controller.recoverPassword)

  //.get("/registerConfirm/:token", controller.registerConfirm)

  .get('/verificationForgotPasswordCode/:phone', controller.verificationForgotPasswordCodePage)

  .post('/verificationForgotPasswordCode', controller.verificationForgotPasswordCode)

  .get('/passwordRecovery/:phone/:code', controller.passwordRecoveryPage)

  .post('/passwordRecovery', controller.passwordRecovery)

  .get('/passwordRecoverySuccess', controller.passwordRecoverySuccessPage)

  .get("/checkIsEmailExist/:newEmail", controller.checkIsEmailExist)

  .post("/checkIsPhoneExist", controller.checkIsPhoneExist)

  
module.exports = router;
