import courseModel from "../models/courseSchema.js"
import AppError from "../utils/error.util.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

const getCourses = async (req, res, next) => {

    try {
        const courses = await courseModel.find({})
        // console.log(courses)
        if (!courses) {
            return next(new AppError('no courses found', 400))
        }
        return res.status(200).json({
            success: true,
            message: 'getting course successfully',
            courses
        })
    } catch (e) {
        return next(new AppError(e.message, 400))
    }
}
const getCourseDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new AppError('please try again', 400));
        }

        const courseDetails = await courseModel.findById(id);

        if (!courseDetails) {
            return next(new AppError('invalid id', 400))
        }

        return res.status(200).json({
            success: true,
            message: 'fetching course details successfully',
            courseDetails
        })
    } catch (e) {
        return next(new AppError(e.message, 400))
    }
}

const createCourse = async (req, res, next) => {
    const { title, description, category, createdBy } = req.body;
    if (!title || !description || !category || !createdBy) {
        next(new AppError('All fields are mandatory', 400))

    }
    const course = await courseModel.create({
        title,
        description,
        category,
        createdBy,
    })
    if (req.file) {
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                heigth: 250,
                gravity: 'faces',
                crop: 'fill'
            });
            if (result) {

                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
                (await course).save()
            }
            // Remove file from server
            fs.rm(`uploads/${req.file.filename}`)

            await course.save

            return res.status(200).json({
                success: true,
                message: 'course created succcessfully',
                course
            })


        }


        catch (e) {
            return next(new AppError(e.message, 500))
        }
    }


}

const updateCourse = async (req, res, next) => {
    // const { title, description } = req.body;
    const { id } = req.params;

    // const course = courseModel.findById({ id });
    // console.log(await course.lectures)

    try {

        const updateCourse = await courseModel.findByIdAndUpdate(id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        )
        if (!updateCourse) {
            return next(new AppError('course with given id does not exist', 500))
        }

        await updateCourse.save();
        return res.status(200).json({
            success: true,
            message: 'course updated successfully',
            data: updateCourse
        })
    }
    catch (e) {
        return next(new AppError(e.message, 500))
    }


}

const deleteCourse = async (req, res, next) => {
    const { id } = req.params;

    // const course = courseModel.findById(id)
    // console.log('course', course)
    try {

        await courseModel.findByIdAndDelete(id)
        return res.status(200).json({
            success: true,
            message: 'successfully deleted'
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }


}

const addLectureById = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const { id } = req.params;


        if (!title || !description) {
            return next(new AppError('All fields are mandatory', 500))
        }

        const course = await courseModel.findById(id);

        if (!course) {
            return next(new AppError('Invaild course id', 500));
        }

        const lectureData = {
            title,
            description,
            lecture: { public_id: 'DUMMY_ID', secure_url: 'DUMMY_URL' }
        }

        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    chunk_size:50000000,
                    resource_type:'video'
                });
                if (result) {
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url
                }

                //  Remove file from server

                fs.rm(`uploads/${req.file.filename}`)

            } catch (e) {
                return next(new AppError(e.message || 'file cannot be uploaded', 500))
            }
        }
        course.lectures.push(lectureData);
        course.numbersOflectures = course.lectures.length
        await course.save()

        return res.status(200).json({
            success: true,
            message: "lecture added successfully",
            lectureData
        })
    }

    catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const deleteLectureById = async (req, res, next) => {
    const { courseId, lectureId } = req.query;
    // console.log('lectureId',lectureId)
    if (!courseId || !lectureId) {
        return next(new AppError('insufficient data', 400));
    }

    try {
        const course = await courseModel.findById(courseId);
        if (!course) {
            return next(new AppError('Invalid course id', 400))
        }

        // console.log('>>>>>>>lectures', course.lectures)
        const courseLectures = course.lectures
        courseLectures.find((el)=> {
            if(el._id == lectureId){
                courseLectures.remove()
            }
        })
        await course.save()
        return res.status(200).json({
            success: true,
            message: 'successfully deleted'
        })
    } catch (error) {
        return next(new AppError(error.message, 400))
    }
}


export {
    getCourses,
    getCourseDetails,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureById,
    deleteLectureById
}