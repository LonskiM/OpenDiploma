import { Router } from "express";
import { createTest, deleteTest, getTestById, submitTest } from "../controllers/test.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/tests/:id", getTestById);
router.post("/tests", authMiddleware, createTest);
router.delete("/tests/:id", authMiddleware, deleteTest);
router.post("/tests/:id/submit", authMiddleware, submitTest);

export default router;