const SubSection = require("../Models/Subsection");
const Section = require("../Models/Section");
const { uploadImageToCloudinary } = require("../Utilis/imageUploader");
const Course = require("../Models/Course");
require("dotenv").config();

exports.createSubSection = async (req, res) => {
    try {
        const { sectionId, title, description } = req.body;

        const video = req.files?.video;

        // console.log("Video : ",video);


        // const requiredFields = ["sectionId", "title", "timeDuration", "description"];
        // const missingFields = requiredFields.filter(field => !req.body[field]);

        // if (missingFields.length > 0) {
        //     return res.status(400).json({ error: `Missing fields: ${missingFields.join(", ")}` });
        // }


        if (!sectionId || !title || !description || !video || sectionId === "undefined") {
            return res.status(400).json({
                success: false,
                message: "All fileds are required"
            })
        }

        console.log("Request Body.....................................................................", req.body);



        const uploadVideoDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        console.log("Lecture Uploaded in cloudinary : ", uploadVideoDetails);

        const newSubSection = await SubSection.create({ title, timeDuration: `${uploadVideoDetails.duration}`, description, videoUrl: uploadVideoDetails.secure_url })

        console.log("NewSubSection is created : ", newSubSection);

        const updatedSection = await Section.findByIdAndUpdate(sectionId,
            {
                $push: {
                    subSection: newSubSection._id
                }
            },
            { new: true }
        ).populate("subSection").exec();

        // console.log("updated Section is created : ", updatedSection);

        const courses = await Course.findOne({
            courseContent: sectionId
        })
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                    model: 'SubSection'
                }
            })
            .populate('ratingAndReviews')
            .populate('category')
            .populate('studentsEnrolled');

        // console.log("Course............. : ", courses);


        return res.status(200).json({
            success: true,
            message: "Create SubSection Successfully",
            updatedSection,
            courses
        })

    } catch (error) {
        console.log(`Error raise at time of creating subsection : `,error);
        return res.status(500).json({
            success: false,
            message: "Internal Error Message",
        })
    }
}

exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId,subSectionId, title, description, videoUrl } = req.body
        const subSection = await SubSection.findOne({ _id: subSectionId })

        console.log("Subsection :",subSection);
        

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
                subSection
            })
        }

        if (title !== undefined) {
            subSection.title = title
        }

        if (description !== undefined) {
            subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }

        if (timeDuration !== undefined) {
            subSection.timeDuration = timeDuration;
        }

        if (videoUrl !== undefined) {
            subSection.videoUrl = videoUrl;
        }

        await subSection.save();

        // const updatedSubSection = await Section.findById(sectionId).populate("subSection");

        const course = await Course.findOne({
            courseContent: sectionId
        })
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                    model: 'SubSection'
                }
            })
            .populate('ratingAndReviews')
            .populate('category')
            .populate('studentsEnrolled');

        // console.log("Course............. : ", courses);

        return res.json({
            success: true,
            message: "SubSection updated successfully",
            data: course
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the section",
        })
    }
}


exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }

        // const updatedSubSection = await Section.findById(sectionId).populate("subSection");
        const course = await Course.findOne({
            courseContent: sectionId
        })
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection',
                    model: 'SubSection'
                }
            })
            .populate('ratingAndReviews')
            .populate('category')
            .populate('studentsEnrolled');

        return res.json({
            success: true,
            message: "SubSection deleted successfully",
            data: course
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the SubSection",
        })
    }
}