const Razorpay = require("razorpay");
require("dotenv").config();

// console.log("key_id : ", process.env.RAZORPAY_KEY, "secret: ", process.env.RAZORPAY_SECRET);


exports.instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
    options: {
        // Enable debugging logs for Razorpay
        logLevel: "debug",
      },
}); 