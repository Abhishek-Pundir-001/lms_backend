import { Router } from "express";
import { addLectureById, createCourse, deleteCourse, deleteLectureById, getCourseDetails, getCourses, updateCourse } from "../controllers/courseController.js";
import { isLoggedIn, authorizeRole } from "../middleware/userAuthMiddleware.js";
import upload from "../middleware/multer.middleware.js";


const router = Router();

router.route('/')
    .get(
        isLoggedIn,
        getCourses)
    .post(
        isLoggedIn,
        authorizeRole('ADMIN'),
        upload.single("thumbnail"),
        createCourse)
    .delete(
        isLoggedIn,
        authorizeRole('ADMIN'),
        deleteLectureById
    )


router.route('/:id')
    .get(
        isLoggedIn,
        authorizeRole('ADMIN'),
        getCourseDetails)
    .put(
        isLoggedIn,
        authorizeRole('ADMIN'),
        updateCourse)
    .delete(
        isLoggedIn,
        authorizeRole('ADMIN'),
        deleteCourse)
    .post(
        isLoggedIn,
        authorizeRole('ADMIN'),
        upload.single("lecture"),
        addLectureById
    )

export default router