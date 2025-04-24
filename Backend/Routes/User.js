const express = require("express");
const router = express.Router();

const {
    changePassword,
    login,
    logout,
    signup,
    sendOTP
} = require("../Controllers/Auth");

const {
    resetPassword,
    resetPasswordToken
} = require("../Controllers/ResetPassword");


const {auth} = require("../middlewares/auth");

// Route for user login
router.post("/login", login);
router.post("/logout", logout);

// Route for user signup
router.post("/signup", signup)

// Route for sending OTP to the user's email
router.post("/sendotp", sendOTP)

// Route for Changing the password
router.post("/changepassword", auth, changePassword);

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

module.exports = router