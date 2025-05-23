const express = require("express")
const router = express.Router()
const { auth, isInstructor } = require("../middlewares/auth")
const {
  deleteAccount,
  updateProfile,
  getAllUsers,
  updateDisplayPicture,
  getEnrolledCourses,
  instructorDashboard
} = require("../Controllers/Profile")


// Delet User Account
router.delete("/deleteProfile", auth, deleteAccount)
router.put("/updateProfile", auth, updateProfile)
router.get("/getUserDetails", auth, getAllUsers)
// Get Enrolled Courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses)
router.put("/updateDisplayPicture", auth, updateDisplayPicture)

router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)



module.exports = router