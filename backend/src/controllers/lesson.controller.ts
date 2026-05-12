import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { createLessonSchema } from "../validation/schemas";
import { logger } from "../utils/logger";
import { ROLE_IDS } from "../constants/roles";
import { canManageCourse } from "../utils/coursePermissions";

// GET /courses/:id/lessons
export const getLessonsByCourse = async (req: Request, res: Response) => {
    try {
        const courseId = Number(req.params.id);
        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            include: {
                tests: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: { orderIndex: "asc" },
        });

        res.json(lessons);
    } catch (error) {
        logger.error({ error }, "Error fetching lessons");
        res.status(500).json({ message: "Error fetching lessons" });
    }
};

// GET /lessons/:id
export const getLessonById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid lesson id" });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id },
            include: {
                tests: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        res.json(lesson);
    } catch (error) {
        logger.error({ error }, "Error fetching lesson");
        res.status(500).json({ message: "Error fetching lesson" });
    }
};

// POST /lessons
export const createLesson = async (req: AuthRequest, res: Response) => {
    try {
        const parsed = createLessonSchema.safeParse({
            ...req.body,
            courseId: Number(req.body?.courseId),
            orderIndex: Number(req.body?.orderIndex),
        });
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid lesson payload" });
        }
        const { title, content, courseId, orderIndex } = parsed.data;
        const user = req.user!;

        if (user.roleId !== ROLE_IDS.ADMIN && user.roleId !== ROLE_IDS.TEACHER) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const allowed = await canManageCourse(user.userId, user.roleId, courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const lesson = await prisma.lesson.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                courseId,
                orderIndex,
            },
        });

        res.json(lesson);
    } catch (error) {
        logger.error({ error }, "Error creating lesson");
        res.status(500).json({ message: "Error creating lesson" });
    }
};

// DELETE /lessons/:id
export const deleteLesson = async (req: AuthRequest, res: Response) => {
    try {
        const lessonId = Number(req.params.id);
        if (!Number.isInteger(lessonId) || lessonId <= 0) {
            return res.status(400).json({ message: "Invalid lesson id" });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true, courseId: true },
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        const allowed = await canManageCourse(req.user!.userId, req.user!.roleId, lesson.courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const tests = await prisma.test.findMany({
            where: { lessonId },
            select: { id: true },
        });
        const testIdList = tests.map((test) => test.id);
        const attempts = testIdList.length
            ? await prisma.testAttempt.findMany({
                  where: { testId: { in: testIdList } },
                  select: { id: true },
              })
            : [];
        const attemptIdList = attempts.map((attempt) => attempt.id);

        await prisma.$transaction(async (tx) => {
            if (attemptIdList.length) {
                await tx.testAnswer.deleteMany({ where: { attemptId: { in: attemptIdList } } });
            }
            if (testIdList.length) {
                await tx.testAttempt.deleteMany({ where: { testId: { in: testIdList } } });
                await tx.answer.deleteMany({ where: { question: { testId: { in: testIdList } } } });
                await tx.question.deleteMany({ where: { testId: { in: testIdList } } });
                await tx.test.deleteMany({ where: { id: { in: testIdList } } });
            }
            await tx.userLesson.deleteMany({ where: { lessonId } });
            await tx.lesson.delete({ where: { id: lessonId } });
        });

        res.status(204).send();
    } catch (error) {
        logger.error({ error }, "Error deleting lesson");
        res.status(500).json({ message: "Error deleting lesson" });
    }
};