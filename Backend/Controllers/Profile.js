const Profile = require("../Models/Profile");
const User = require("../Models/User");
const Course = require("../Models/Course");
const { uploadImageToCloudinary } = require("../Utilis/imageUploader");
const mongoose = require('mongoose');
const { convertSecondsToDuration } = require("../Utilis/setToDuration");
const CourseProgress = require("../Models/CourseProgress");
const { ObjectId } = mongoose.Types; // Import ObjectId from mongoose

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gender, dateOfBirth, about, contactNumber } = req.body;

    if (!gender || !userId || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties"
      })
    }

    const findUser = await User.findById(userId);

    if (!findUser) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist"
      })
    }


    const profileId = findUser.additionDetails;

    const profileDetails = await Profile.findById(profileId);

    profileDetails.gender = gender;
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.contactNumber = contactNumber;

    await profileDetails.save();

    return res.status(200).json({
      success: true,
      message: "Profile Update Successfully",
      profileDetails
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;
    console.log(id);

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await Course.updateMany(
      { studentsEnrolled: ObjectId(id) },
      { $pull: { studentsEnrolled: ObjectId(id) } }
    );

    await Profile.findByIdAndDelete({ _id: user.additionDetails });

    // TODO : Add business logic for task scheduling - cron job
    await User.findByIdAndDelete({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Account Deleted Successfully"
    });

  } catch (error) {
    console.log(`Error occurred while deleting account: ${error}`);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getAllUsers = async (req, res) => {

  try {
    const id = req.user.id;

    const user = await User.findById(id).populate("additionDetails").exec();

    res.status(200).json({
      success: true,
      message: "User Data Fetch Successfully",
      user
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture
    const userId = req.user.id
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    console.log(image)
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    )
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    let userDetails = await User.findOne({ _id: userId })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: { path: "subSection" },
        },
      })
      .exec();

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userId}`,
      });
    }

    userDetails = userDetails.toObject();

    for (let i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      let totalSubsections = 0;

      for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        const subSections = userDetails.courses[i].courseContent[j].subSection;

        if (Array.isArray(subSections) && subSections.length > 0) {
          subSections.forEach((subSec) => {
            console.log("Subsection Data:", subSec);
            console.log("Subsection Duration:", subSec.timeDuration);
            totalDurationInSeconds += parseInt(subSec.timeDuration || "0", 10);
          });

          totalSubsections += subSections.length;
        }
      }

      console.log(`Course: ${userDetails.courses[i].courseName}, Total Duration: ${totalDurationInSeconds}s`);

      userDetails.courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);

      let courseProgress = await CourseProgress.findOne({
        courseId: userDetails.courses[i]._id,
        userId: userId,
      });

      const completedVideosCount = courseProgress?.completedVideos.length || 0;

      userDetails.courses[i].progressPercentage = totalSubsections === 0
        ? 100
        : Math.round((completedVideosCount / totalSubsections) * 100 * 100) / 100;
    }

    console.log("Final Processed Course Data:", userDetails.courses);

    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    console.error("Error in getEnrolledCourses:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const courseDetails = await Course.find({ instructor: userId });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length
      const totalAmountGenerated = totalStudentsEnrolled * course.price

      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.CourseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated
      }

      return courseDataWithStats
    })

    return res.status(200).json({
      success: true,
      courses: courseData
    });

  } catch (error) {
    console.log("Error occured ...........................:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}