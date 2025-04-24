const RatingAndReviewModel = require("../Models/RatingAndReview");
const Course = require("../Models/Course");
const mongoose = require("mongoose");

exports.createRatingAndReview = async (req, res) => {
    try {
        const { rating, review, courseId } = req.body;
        const userId = req.user.id;

        if (!rating || !review || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing properties"
            });
        }

        const courseExist = await Course.findById(courseId);

        if (!courseExist) {
            return res.status(400).json({
                success: false,
                message: "Invalid Course ID"
            });
        }

        // Check if user is enrolled in the course
        const enrolledUser = await Course.findOne({
            _id: courseId,
            studentsEnrolled: userId // Simplified the query
        });

        if (!enrolledUser) {
            return res.status(400).json({
                success: false,
                message: "User is not enrolled in this course"
            });
        }

        // Check if user already reviewed the course
        const userAlreadyReviewed = await RatingAndReviewModel.findOne({
            user: userId,
            course: courseId
        });

        if (userAlreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "Course has already been reviewed by you..."
            });
        }

        // Create Ratings and Reviews
        const reviewAndRatingDetails = await RatingAndReviewModel.create({
            user: userId,
            rating,
            review,
            course: courseId
        });

        // Update the course with the new review
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: { ratingAndReviews: reviewAndRatingDetails._id }
            },
            { new: true }
        ).lean(); // Use .lean() to get a plain JavaScript object

        return res.status(200).json({
            success: true,
            message: "Rating and Review submitted successfully",
            data: updatedCourse // Ensuring a plain object is returned
        });

    } catch (error) {
        console.error("Error while rating and review:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.averageRatingAndReview = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing Propertise"
            })
        }

        const courseExist = await Course.findById(courseId);

        if (!courseExist) {
            return res.status(400).json({
                success: false,
                message: "Invalid Course ID"
            })
        }

        const result = await RatingAndReviewModel.aggregate([
            {
                $match: { course: mongoose.Schema.Types.ObjectId(courseId) }
            },
            {
                $group: {
                    _id: null,
                    averageRating: {
                        $avg: "rating"
                    }
                }
            }
        ])

        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating
            })
        }

        return res.status(200).json({
            success: true,
            averageRating: `AverageRating is 0, no ratings is given till now`
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getAllRating = async (req, res) => {
    try {
        const ratings = await RatingAndReviewModel.find({}).sort({ rating: "desc" }).populate({
            path: "user",
            select: "firstName lastName email image"
        }).populate({
            path: "course",
            select: "courseName"
        }).exec();

        return res.status(200).json({
            success: true,
            message: `All Reviews fetch successfully`,
            ratings
        })

    } catch (error) {
        console.log("error occured at getAllRating...............:",error);
        
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}