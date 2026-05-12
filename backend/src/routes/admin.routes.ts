import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    getPendingCourses,
    getUsers,
    moderateCourse,
    updateUserRole,
} from "../controllers/admin.controller";

const router = Router();

router.get("/users", authMiddleware, getUsers);
router.patch("/users/:id/role", authMiddleware, updateUserRole);
router.get("/courses/pending", authMiddleware, getPendingCourses);
router.patch("/courses/:id/moderation", authMiddleware, moderateCourse);

export default router;
