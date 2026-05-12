import { Router } from "express";
import {
    getLessonsByCourse,
    getLessonById,
    createLesson,
    deleteLesson,
} from "../controllers/lesson.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// важно: порядок!
router.get("/courses/:id/lessons", getLessonsByCourse);
router.get("/lessons/:id", getLessonById);
router.post("/lessons", authMiddleware, createLesson);
router.delete("/lessons/:id", authMiddleware, deleteLesson);

export default router;