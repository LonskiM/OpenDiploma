import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { completeLessonSchema } from "../validation/schemas";
import { logger } from "../utils/logger";

// POST /progress/complete-lesson
export const completeLesson = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const parsed = completeLessonSchema.safeParse({
            lessonId: Number(req.body?.lessonId),
        });
        if (!parsed.success) {
            return res.status(400).json({ message: "Valid lessonId is required" });
        }
        const { lessonId } = parsed.data;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // проверяем, уже проходил ли урок
        const existing = await prisma.userLesson.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId,
                },
            },
        });

        if (existing) {
            return res.json({ message: "Lesson already completed" });
        }

        // сохраняем прохождение урока
        await prisma.userLesson.create({
            data: {
                userId,
                lessonId,
            },
        });

        const courseId = lesson.courseId;

        // считаем общее количество уроков
        const totalLessons = await prisma.lesson.count({
            where: { courseId },
        });

        // считаем пройденные уроки
        const completedLessons = await prisma.userLesson.count({
            where: {
                userId,
                lesson: {
                    courseId,
                },
            },
        });

        const percent = Math.round((completedLessons / totalLessons) * 100);

        // обновляем или создаём progress
        let progress = await prisma.userProgress.findFirst({
            where: { userId, courseId },
        });

        if (!progress) {
            progress = await prisma.userProgress.create({
                data: {
                    userId,
                    courseId,
                    completedLessons,
                    progressPercent: percent,
                },
            });
        } else {
            progress = await prisma.userProgress.update({
                where: { id: progress.id },
                data: {
                    completedLessons,
                    progressPercent: percent,
                },
            });
        }

        res.json(progress);
    } catch (error) {
        logger.error({ error }, "Error updating progress");
        res.status(500).json({ message: "Error updating progress" });
    }
};

// GET /progress/:courseId
export const getProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const courseId = Number(req.params.courseId);
        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const progress = await prisma.userProgress.findFirst({
            where: {
                userId,
                courseId,
            },
        });

        if (!progress) {
            return res.json({
                completedLessons: 0,
                progressPercent: 0,
            });
        }

        res.json(progress);
    } catch (error) {
        logger.error({ error }, "Error fetching progress");
        res.status(500).json({ message: "Error fetching progress" });
    }
};

// GET /progress/me
export const getMyProgress = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;

        const [courseProgress, testAttempts] = await Promise.all([
            prisma.userProgress.findMany({
                where: { userId },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
                orderBy: {
                    progressPercent: "desc",
                },
            }),
            prisma.testAttempt.findMany({
                where: { userId },
                include: {
                    test: {
                        include: {
                            lesson: {
                                include: {
                                    course: {
                                        select: {
                                            id: true,
                                            title: true,
                                        },
                                    },
                                },
                            },
                            questions: {
                                select: { id: true },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
        ]);

        res.json({
            courseProgress,
            testAttempts: testAttempts.map((attempt) => ({
                id: attempt.id,
                score: attempt.score,
                total: attempt.test.questions.length,
                createdAt: attempt.createdAt,
                test: {
                    id: attempt.test.id,
                    title: attempt.test.title,
                },
                lesson: {
                    id: attempt.test.lesson.id,
                    title: attempt.test.lesson.title,
                },
                course: attempt.test.lesson.course,
            })),
        });
    } catch (error) {
        logger.error({ error }, "Error fetching profile progress");
        res.status(500).json({ message: "Error fetching profile progress" });
    }
};