import { Router } from "express";
import {
    addTeacherToCourse,
    getCourseTestAttempts,
    getCourses,
    getCourseById,
    createCourse,
    deleteCourse,
    updateCourse,
} from "../controllers/course.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { ROLE_IDS } from "../constants/roles";

const router = Router();

router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post(
    "/",
    authMiddleware,
    requireRole([ROLE_IDS.ADMIN, ROLE_IDS.TEACHER]),
    createCourse
);
router.put("/:id", authMiddleware, updateCourse);
router.delete("/:id", authMiddleware, deleteCourse);
router.post("/:id/teachers", authMiddleware, addTeacherToCourse);
router.get("/:id/test-attempts", authMiddleware, getCourseTestAttempts);

export default router;