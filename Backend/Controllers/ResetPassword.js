// ResetpasswordToken
const User = require("../Models/User");
const mailSender = require("../Utilis/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

exports.resetPasswordToken = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(401).json({
                success: false,
                message: "All fileds are required",
            })
        }

        const userExist = await User.findOne({ email });

        if (!userExist) {
            return res.status(401).json({
                success: false,
                message: "Your email is not registered with us"
            })
        }

        const token = crypto.randomBytes(20).toString("hex");

        const updateDetails = await User.findOneAndUpdate
            (
                { email },
                {
                    token: token,
                    resetPasswordExpires: Date.now() + 5 * 60 * 1000
                },
                { new: true }
            )
        
        console.log("DETAILS", updateDetails);
    

        const url = `http://localhost:3000/update-password/${token}`;

        await mailSender(email, "Password Reset Link", `Password Reset Link :${url}`);

        return res.status(200).json({
            success: true,
            message: "Reset password link sent successfully in email"
        })


    } catch (err) {
        console.log(`error occured in Reset Password Link controller`);

        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// Reset

exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        if (!password || !confirmPassword) {
            return res.status(403).json({
                success: false,
                message: "All fileds are required"
            })
        }

        if (!token) {
            return res.status(403).json({
                success: false,
                message: "Token not found"
            })
        }

        if (password !== confirmPassword) {
            return res.status(403).json({
                success: false,
                message: "both password are different"
            })
        }

        const userDetails = await User.findOne({ token });

        if (!userDetails) {
            return res.status(403).json({
                success: false,
                message: "Token is invalid"
            })
        }

        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(403).json({
                success: false,
                message: "Token is expired, please regenerate your token"
            })
        }

        console.log(userDetails.resetPasswordExpires );
        

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate(
            { token },
            { password: hashedPassword },
            { new: true }
        )
        
        return res.status(200).json({
            success: true,
            message: `Password reset successful`
        })

    } catch (err) {
        console.log(`Error occured in reset password handler`);
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}