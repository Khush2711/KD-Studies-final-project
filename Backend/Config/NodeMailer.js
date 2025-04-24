const nodemailer = require("nodemailer");
require("dotenv").config();

exports.transporter = () => {
  try {
    return nodemailer.createTransport({
      host: process.env.HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD,
      },
    });
  } catch (err) {
    console.log('Error Occured in transporter', err.message);
  }
}