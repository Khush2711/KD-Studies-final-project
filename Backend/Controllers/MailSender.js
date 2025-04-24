const sendMail = require("../Utilis/mailSender");

const mailSender = async (req, res) => {
    try {
        const { email, title, body } = req.body;

        if (!email || !title || !body) {
            return res.status(401).json({
                success: false,
                message: "All Fields are required..."
            })
        }

        await sendMail(email, title, body);

        return res.status(200).json({
            success: true,
            message: "Mail send successfully..."
        })

    } catch (error) {
        console.log("Error Occured at the time of sending mail............", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error...."
        })
    }
}

module.exports = { mailSender };