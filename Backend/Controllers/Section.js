const Section = require("../Models/Section");
const Course = require("../Models/Course");
const Subsection = require("../Models/Subsection");

/*
exports.createSection = async (req, res) => {
    try {

        const { sectionName, courseId } = req.body;

        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties"
            })
        }

        const newSection = await Section.create({ sectionName: sectionName });

        const updateCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: newSection._id
                }
            },
            { new: true }
        )
        // TODO : Populate

        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            data:{
                updateCourse,
                newSection
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}
    */

exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body;

        // Validate input
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Both sectionName and courseId are required.",
            });
        }

        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        // Create the new section
        const newSection = await Section.create({ sectionName });

        // Add the new section to the course's courseContent
        course.courseContent.push(newSection._id);
        await course.save();

        // Populate the updated course with section details
        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    model: "SubSection"
                }
            }); console.log("Updated Course:", updatedCourse);


        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            data: {
                updatedCourse
            },
        });

    } catch (error) {
        console.error("Error in createSection:", error.message);
        return res.status(500).json({
            success: false,
            message: "An internal server error occurred.",
        });
    }
};



exports.updateSection = async (req, res) => {
    try {
        const { sectionName, sectionId, courseId } = req.body;

        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Missing Properties"
            })
        }

        const updateSection = await Section.findByIdAndUpdate(sectionId,
            { sectionName },
            { new: true }
        );

        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "Section Updated Successfully",
            data: course
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

exports.deleteSection = async (req, res) => {
    try {

        const { sectionId, courseid: courseId } = req.body;

        // console.log(`................................Section ID : ${sectionId}\ncourse ID : ${courseId}.........`,req.body);


        await Course.findByIdAndUpdate(courseId, {
            $pull: {
                courseContent: sectionId,
            }
        })
        const section = await Section.findById(sectionId);
        console.log(sectionId, courseId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not Found",
            })
        }

        //delete sub section
        await Subsection.deleteMany({ _id: { $in: section.subSection } });

        await Section.findByIdAndDelete(sectionId);

        //find the updated course and return 
        const course = await Course.findById(courseId).populate({
            path: "courseContent",
            populate: {
                path: "subSection"
            }
        })
            .exec();

        res.status(200).json({
            success: true,
            message: "Section deleted",
            data: course
        });
    } catch (error) {
        console.error("Error deleting section:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};   