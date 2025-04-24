const mongoose = require("mongoose");
const Course = require("./Course");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    confirmPassword: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
        enum: ["Admin", "Student", "Instructor"],
        required: true,
    },
    additionDetails: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Profile" // Model Name
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Course"
    }],
    image: {
        type: String,
        required: true
    },
    token: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    courseProgress: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseProgress"
    }]
});

userSchema.pre('findOneAndDelete', async function (next) {
    try {
      const userId = this.id;
      console.log(`Pre hook user ID : ${userId}`);

      const removeUser = await Course.updateMany(
        { studentsEnrolled: userId },
        { $pull: { studentsEnrolled: userId } }
      );

      console.log(`Pre hook log : ${removeUser}`);
      

      next();
    } catch (error) {
      next(error);
    }
  });

module.exports = mongoose.model("User", userSchema);