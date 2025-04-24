const mongoose = require("mongoose");
const mailSender = require("../Utilis/mailSender");
const otpMailTemplate = require("../Mail/Template/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60
    }
});

async function sendVerificationMail(email, otp) {
    try {

        const emailBody = otpMailTemplate(otp);
        const mailResponse = await mailSender(email, "Verification Mail", emailBody);
        // console.log(`Mail sending ${mailResponse}`);


        // return for log purpose
        return mailResponse;
    } catch (error) {
        console.log("Error occured while Sending mail", error);
        throw new Error(error.message);
    }
}

OTPSchema.pre("save", async function (next) {
    try {

        console.log("New document saved to database");

        if (this.isNew) {
            const emailSendingLog = await sendVerificationMail(this.email, this.otp);
            // console.log(`emailSendingLog : ${emailSendingLog}`);

        }
        next();
    }
    catch (error) {
        console.log(`error occured ${error}`);
        throw new Error(error.message);
    }
})


module.exports = mongoose.model("OTP", OTPSchema);