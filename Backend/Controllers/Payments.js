const mongoose = require("mongoose");
const crypto = require("crypto");
const { instance } = require("../Config/Razorpay");
const Course = require("../Models/Course");
const User = require("../Models/User");
const MailSender = require("../Utilis/mailSender");
const { courseEnrollmentEmail } = require("../Mail/Template/courseEnrollmentEmail");
const sendMail = require("../Utilis/mailSender");
const { paymentSuccessEmail } = require("../Mail/Template/paymentSuccessEmail");
const CourseProgress = require("../Models/CourseProgress");

require("dotenv").config();

// create order

exports.capturePayment = async (req, res) => {
    try {
        const { courses } = req.body;
        const userId = req.user.id;


        // console.log(courses);
        if (!courses || !userId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required..."
            })
        }

        if (courses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide Course Id"
            })
        }

        let totalAmount = 0;

        for (const course_id of courses) {
            let course;

            try {
                // console.log("course id....................",course_id);

                course = await Course.findById(course_id);

                if (!course) {
                    return res.status(400).json({
                        success: false,
                        message: "Could not find the course"
                    })
                }

                // Check User has done payment before for the same course
                // const uid = new mongoose.Schema.Types.ObjectId(userId);
                const uid = new mongoose.Types.ObjectId(userId);


                if (course.studentsEnrolled.includes(uid)) {
                    return res.status(400).json({
                        success: false,
                        message: "Student already enrolled"
                    })
                }
                totalAmount += course.price;
            } catch (error) {
                console.log("Error occured while creating capturePayment controller................. ", error);
                return res.status(500).json({
                    success: false,
                    message: error.message
                })
            }
        }

        console.log("total amount..................................................", totalAmount);



        // Create order || Razorpay
        const amount = totalAmount;
        const currency = "INR";

        const option = {
            amount: amount * 100,
            currency: currency,
            receipt: Math.random(Date.now()).toString()
        }

        // initiate payment using razorpay
        const paymentResponse = await instance.orders.create(option);
        console.log("paymentResponse : ", paymentResponse);

        return res.status(200).json({
            success: true,
            message: paymentResponse
        })

    } catch (error) {
        console.log("Error occured while creating capturePayment controller................. ", error);
        return res.status(500).json({
            success: false,
            message: "Could not initiate order"
        })
    }
}


exports.verifySignature = async (req, res) => {

    try {

        console.log("razorpay",process.env.RAZORPAY_SECRET);
        

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courses } = req.body;
        const userId = req.user.id;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId) {
            return res.status(402).json({ success: false, message: "Payment Failed" });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(402).json({ success: false, message: "Payment Failed" });
        }

        // Enroll the student asynchronously
        await enrollStudents(courses, userId);

        // Respond immediately
        res.status(200).json({ success: true, message: "Payment Verified" });

    } catch (error) {
        console.log("Error in verifySignature:", error);
        return res.status(500).json({ success: false, message: "Could not enroll student in the course" });
    }
};



const enrollStudents = async (courses, userId, res) => {

    console.log("Enroll Students courses..........................", courses)

    for (const course_id of courses) {
        try {
            console.log("course ID.........................", course_id)
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: course_id },
                { $push: { studentsEnrolled: userId } },
                { new: true }
            )

            // console.log("Enrolled Course.........................",enrolledCourse)


            if (!enrolledCourse) {
                return res.status(400).json({
                    success: false,
                    message: "Course not found"
                })
            }

            const courseProgress = await CourseProgress.create({
                courseId: course_id,
                userId: userId,
                completedVideos: []
            })

            const enrolledStudent = await User.findOneAndUpdate(
                { _id: userId },
                {
                    $push: {
                        courses: course_id,
                        courseProgress: courseProgress._id
                    }
                },
                { new: true }
            )

            const emailResponse = await MailSender(enrolledStudent.email,
                `Congratulations, you are onboarded into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, `${enrollStudents.firstName} ${enrollStudents.lastName}`));

            console.log("Email Sent Successfully...", emailResponse.response);
        } catch (error) {
            console.log("Error occured while enrolling student in course and course in student................. ", error);
            return res.status(500).json({
                success: false,
                message: "Could not enroll student in the course"
            })
        }

    }
}


exports.sendPaymentSuccessEmail = async (req, res) => {
    try {
        const { orderId, paymentId, amount } = req.body;

        const userId = req.user.id;

        if (!orderId || !paymentId || !amount || !userId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const enrolledStudent = await User.findById(userId);

        await sendMail(enrolledStudent.email, 'Payment Received', paymentSuccessEmail(enrolledStudent.firstName, amount / 100, orderId, paymentId));

    } catch (error) {
        console.log("Error occured while send Payment Success Email................. ", error);
        return res.status(500).json({
            success: false,
            message: "Could not send mail"
        })
    }
}

// Create Order
/*
exports.capturePayment = async (req, res) => {
    try {
        // Fetch user id and course id
        const { courseId } = req.body;
        const userId = req.user.id;

        // Validation
        if (!courseId) {
            return res.status(404).json({
                success: false,
                message: "Course Id Not Found"
            })
        }

        let course = await Course.findById(courseId);

        // Course Validation
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course Not Found"
            })
        }

        // Check User has done payment before for the same course
        const uid = new mongoose.Schema.Types.ObjectId(userId);

        if (course.studentsEnrolled.includes(uid)) {
            return res.status(400).json({
                success: false,
                message: "User already enrolled"
            })
        }

        // Create order || Razorpay
        const amount = course.price;
        const currency = "INR";

        const option = {
            amount: amount * 100,
            currency: currency,
            recepit: Math.random(Date.now()).toString(),
            notes: {
                courseId: courseId,
                userId: userId
            }
        }

        // initiate payment using razorpay
        const paymentResponse = await instance.orders.create(option);
        console.log("paymentResponse : ", paymentResponse);

        return res.status(200).json({
            success: true,
            courseName: course.courseName,
            courseDescription: course.CourseDescription,
            thumbnail: course.thumbnail,
            orderID: paymentResponse.id,
            Currency: paymentResponse.currency,
            amount: paymentResponse.amount
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}



exports.verifySignature = async (req, res) => {
    try {
        // This is secret which is store in server
        const webhookSecret = "12345678";

        // This is secret which comes with api request
        const signature = req.headers["x-razorpay-signature"];

        const shasum = crypto.createHmac("sha256", webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if (signature === digest) {
            console.log("Payment is authorized");
            const { courseId, userId } = req.body.payload.payment.entity.notes;


            // Find Course and add student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                {
                    _id: courseId
                },
                {
                    $push: {
                        studentsEnrolled: userId
                    }
                },
                { new: true }
            )

            if (!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course not Found"
                })
            }

            // Give access of course to student
            const enrolledStudent = await User.findOneAndUpdate(
                {
                    _id: userId
                },
                {
                    $push: {
                        courses: courseId
                    }
                },
                { new: true }
            )

            // Send Confirmation Mail

            const emailResponse = await MailSender("khushdesai2711@gmail.com",
                `Congratulations, you are onboarded into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail);

            return res.status(200).json({
                sucess: true,
                message: "Signature verify and course added successfully"
            })



        }
        else {
            return res.status(400).json({
                success: false,
                message: "Invalid request"
            })
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
*/