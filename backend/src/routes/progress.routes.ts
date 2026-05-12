import { Router } from "express";
import {
    completeLesson,
    getMyProgress,
    getProgress,
} from "../controllers/progress.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/progress/complete-lesson", authMiddleware, completeLesson);
router.get("/progress/me", authMiddleware, getMyProgress);
router.get("/progress/:courseId", authMiddleware, getProgress);

export default router;