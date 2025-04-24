const { transporter } = require("../Config/NodeMailer");


async function sendMail(email, title, body) {
    try {

        const mailer = transporter();

        const info = await mailer.sendMail({
            // TODO: Email id of sender required
            from: 'obama3839@gmail.com', // sender address
            to: email, // list of receivers
            subject: title, // Subject line
            html: body, // html body
        });

        return info;
        
    } catch (err) {
        console.log("Error occured in mailSender file", err);
        throw new Error(err.message);
    }
}

module.exports = sendMail;
