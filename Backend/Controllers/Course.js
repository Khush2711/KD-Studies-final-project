const mongoose = require("mongoose");
const Course = require("../Models/Course");
const Category = require("../Models/Category");
const User = require("../Models/User");
const { uploadImageToCloudinary } = require("../Utilis/imageUploader");
const Section = require("../Models/Section");
const Subsection = require("../Models/Subsection");
const { convertSecondsToDuration } = require("../../Front End/src/utils/setToDuration");
const CourseProgress = require("../Models/CourseProgress");
require("dotenv").config();


exports.createCourse = async (req, res) => {
    try {
        // Get details from request body
        const {
            courseName,
            CourseDescription,
            whatYouWillLearn,
            price,
            category,
            tag,
            instructions,
        } = req.body;
        let { status } = req.body;

        const thumbnail = req?.files?.thumbnailImage;

        // console.log("category...........................", category);


        // // Check if any of the required fields are missing
        if (!category || !courseName || !CourseDescription || !whatYouWillLearn || !price || !category || !thumbnail || !tag) {

            return res.status(403).json({
                success: false,
                message: `All fileds are required`
            })
        }

        // Proceed if all fields are provided
        // Your remaining code here

        const userId = req.user.id;

        if (!status || status === undefined) {
            status = "Draft";
        }

        // Check if the user is an instructor
        const isInstructor = await User.findById(userId, {
            accountType: "Instructor",
        });

        if (!isInstructor) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details Not Found",
            });
        }

        // Check if the Category given is valid
        const CategoryDetails = await Category.findById(category);
        if (!CategoryDetails) {
            return res.status(404).json({
                success: false,
                message: `CategoryDetails Details not found`
            })
        }

        // Upload the Thumbnail to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        const tagsArray = tag ? tag.split(",") : [];

        let array = [];
        if (instructions) {
            const jsonString = instructions.replace(/'/g, '"');
            array = JSON.parse(jsonString);

        }


        // console.log("courseDescription.....................................", array)

        const newCourse = await Course.create({
            courseName,
            CourseDescription,
            instructor: isInstructor._id,
            whatYouWillLearn,
            price,
            category: category,
            thumbnail: thumbnailImage.secure_url,
            tag: tagsArray,
            instructions: array,
            status
        })

        // Add new course in Instructor's array
        await User.findByIdAndUpdate(
            { _id: isInstructor._id },
            {
                $push: {
                    courses: newCourse._id
                }
            },
            { new: true }
        );

        // update Category
        await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    course: newCourse._id,
                },
            },
            { new: true }
        );


        return res.status(200).json({
            success: true,
            message: `New Course created successfully`,
            data: newCourse,
        })

    } catch (err) {
        console.log(`Error occured at the time of creating course : ${err}`);

        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

exports.editCourse = async (req, res) => {
    try {
        let { courseId, status } = req.body;

        console.log("Course ID : ", courseId);

        if (!courseId || !status) {
            return res.status(400).json({ // Changed to 400 Bad Request for missing fields
                success: false,
                message: `All fields are required`
            });
        }

        const userId = req.user.id;

        let course = await Course.findById(courseId);

        if (!course) { // Check if the course exists
            return res.status(404).json({ // 404 Not Found if course doesn't exist
                success: false,
                message: `Course not found`
            });
        }

        // console.log(`course.instructor ${course.instructor} userId : ${userId}`);

        if (course.instructor.toString() !== userId.toString()) { // Compare as strings
            return res.status(403).json({ // Changed to 403 Forbidden for unauthorized access
                success: false,
                message: `You are not authorized to update this course`
            });
        }

        // Validate status.  Only allow "Published" for now, or handle other statuses.
        if (status !== "Published") {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Only 'Published' is currently supported."
            });
        }


        course = await Course.findByIdAndUpdate(courseId, {
            status: status // Use the provided status
        }, { new: true, runValidators: true }); // Important: { new: true } and runValidators

        if (!course) { // Check if update was successful (might be an issue with findByIdAndUpdate)
            return res.status(500).json({
                success: false,
                message: "Failed to update course."
            });
        }


        return res.status(200).json({
            success: true,
            message: `Course Updated Successfully`,
            course: course // Return the updated course
        });

    } catch (err) {
        console.error("Error occurs at the time of editing course : ", err); // Use console.error for errors
        return res.status(500).json({
            success: false,
            message: `Something went wrong`
        });
    }
};

exports.getAllCourse = async (req, res) => {
    try {
        const allCourses = Course.find({},
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true
            }).populate("instructor").exec();

        let totalDurationInSeconds = 0
        allCourses.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        let totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        allCourses.totalDuration = totalDuration;

        return res.status(200).json({
            success: true,
            message: `Data for all courses fetch successfully`,
            data: allCourses
        })


    } catch (err) {
        return res.status(500).json({
            success: true,
            message: err.message
        })
    }
}

exports.getCourseDetails = async (req, res) => {
    try {

        const { courseId } = req.body;

        // Find Is Used By LB
        const courseDetails = await Course.findById(courseId).populate(
            {
                path: "instructor",
                populate: {
                    path: "additionDetails"
                }
            }
        ).populate(
            {
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            },
        ).populate("ratingAndReviews")
            .populate("category")
            .populate("studentsEnrolled")
            .exec();
        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find the course with courseId : ${courseId}`
            })
        }

        // Convert Mongoose document to plain object
        const courseDetailsObject = courseDetails.toObject();

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)


        courseDetailsObject.totalDuration = totalDuration;

        return res.status(200).json({
            success: true,
            message: `Course Details Fetch Successfully`,
            courseDetails: courseDetailsObject
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;

        const instructorCourses = await Course.find({
            instructor: instructorId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            courses: instructorCourses
        })

    } catch (error) {
        console.log("Error occured at retrieving instructor courses.......", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message
        })
    }
}

exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const userId = req.user.id;
        if (userId.toString() !== course.instructor.toString()) {
            return res.status(403).json({
                success: false,
                message: "Only authorized persons can delete this course",
            });
        }

        // Remove the course from all enrolled students
        await Promise.all(
            course.studentsEnrolled.map((studentId) =>
                User.findByIdAndUpdate(studentId, {
                    $pull: { courses: courseId },
                })
            )
        );

        // Delete all subsections and sections
        await Promise.all(
            course.courseContent.map(async (sectionId) => {
                const section = await Section.findById(sectionId);
                if (section) {
                    await Promise.all(
                        section.subSection.map((subSectionId) =>
                            Subsection.findByIdAndDelete(subSectionId)
                        )
                    );
                }
                await Section.findByIdAndDelete(sectionId);
            })
        );

        // Delete the course after all related data is removed
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        });
    } catch (error) {
        console.log("Server Error at the time of deleting Course:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};


exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const user = req.user; // Extract full user object

        console.log("User Object:", user);
        console.log("courseID:", courseId);

        // Extract userId from user object
        const userId = user?.id;

        // Validate courseId and userId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid courseId provided.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid userId provided.",
            });
        }

        // Fetch course details with population
        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: { path: "additionDetails" },
            })
            .populate({
                path: "courseContent",
                populate: { path: "subSection" },
            })
            .populate("ratingAndReviews")
            .populate("category")
            .populate("studentsEnrolled")
            .exec();

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Could not find the course with courseId: ${courseId}`,
            });
        }

        // Fetch course progress for the user
        const courseProgressCount = await CourseProgress.findOne({
            courseId: courseId,
            userId: userId,
        });

        // Calculate total duration
        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            });
        });

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        console.log("courseProgressCount...................:",courseProgressCount);
        

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos || [],
            },
        });
    } catch (error) {
        console.error("Error in getFullCourseDetails:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};
