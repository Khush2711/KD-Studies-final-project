const express = require("express")
const router = express.Router()

const {
    mailSender
} = require("../Controllers/MailSender")

router.post("/sendMail", mailSender);


module.exports = router