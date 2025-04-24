const CourseProgress = require("../Models/CourseProgress");
const Subsection = require("../Models/Subsection");

exports.updateCourseProgress = async (req, res) => {
    const { courseId, subSectionId } = req.body;
    const userId = req.user.id;

    try {
        const subSection = await Subsection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Invalid Subsection"
            })
        }

        let courseProgress = await CourseProgress.findOne({
            courseId: courseId,
            userId: userId
        });

        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "course progress does not exist"
            })
        }
        else
        {
            if(courseProgress.completedVideos.includes(subSectionId)){
                return res.status(400).json({
                    success:false,
                    message:"Subsection already mark as completed..."
                })
            }

            courseProgress.completedVideos.push(subSectionId);
        }

        await courseProgress.save();

        return res.status(200).json({
            success:true,
            message:"Subsection mark as completed successfully..."
        })

    } catch (error) {
        console.log("Error in updateCourseProgress controller..............",error);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error..."
        })
    }
}