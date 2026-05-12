import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";
import { createTestSchema } from "../validation/schemas";
import { ROLE_IDS } from "../constants/roles";
import { canManageCourse } from "../utils/coursePermissions";

interface SubmittedAnswer {
    questionId: number;
    answerId: number;
}

// GET /tests/:id
export const getTestById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid test id" });
        }

        const test = await prisma.test.findUnique({
            where: { id },
            include: {
                questions: {
                    include: {
                        answers: {
                            select: {
                                id: true,
                                text: true,
                            }, // НЕ отдаём isCorrect
                        },
                    },
                },
            },
        });

        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        res.json(test);
    } catch (error) {
        res.status(500).json({ message: "Error fetching test" });
    }
};

// POST /tests/:id/submit
export const submitTest = async (req: AuthRequest, res: Response) => {
    try {
        const testId = Number(req.params.id);
        const userId = req.user!.userId;
        if (!Number.isInteger(testId) || testId <= 0) {
            return res.status(400).json({ message: "Invalid test id" });
        }

        const { answers } = req.body;
        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: "answers must be an array" });
        }

        const normalizedAnswers: SubmittedAnswer[] = answers.map((item) => ({
            questionId: Number(item?.questionId),
            answerId: Number(item?.answerId),
        }));

        if (
            normalizedAnswers.some(
                (item) =>
                    !Number.isInteger(item.questionId) ||
                    item.questionId <= 0 ||
                    !Number.isInteger(item.answerId) ||
                    item.answerId <= 0
            )
        ) {
            return res.status(400).json({ message: "answers contain invalid questionId or answerId" });
        }

        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: {
                questions: {
                    include: {
                        answers: {
                            select: { id: true, isCorrect: true },
                        },
                    },
                },
            },
        });
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        const questionToAnswers = new Map<number, Set<number>>();
        const correctAnswers = new Map<number, number>();

        for (const question of test.questions) {
            questionToAnswers.set(
                question.id,
                new Set(question.answers.map((answer) => answer.id))
            );
            const correct = question.answers.find((answer) => answer.isCorrect);
            if (correct) {
                correctAnswers.set(question.id, correct.id);
            }
        }

        let score = 0;
        for (const ans of normalizedAnswers) {
            const validAnswers = questionToAnswers.get(ans.questionId);
            if (!validAnswers || !validAnswers.has(ans.answerId)) {
                return res.status(400).json({ message: "answers do not match this test" });
            }

            if (correctAnswers.get(ans.questionId) === ans.answerId) {
                score++;
            }
        }

        // сохраняем попытку
        const attempt = await prisma.testAttempt.create({
            data: {
                userId,
                testId,
                score,
                answers: {
                    create: normalizedAnswers.map((a) => ({
                        questionId: a.questionId,
                        answerId: a.answerId,
                    })),
                },
            },
        });

        res.json({
            score,
            total: normalizedAnswers.length,
        });
    } catch (error) {
        logger.error({ error }, "Error submitting test");
        res.status(500).json({ message: "Error submitting test" });
    }
};

// POST /tests
export const createTest = async (req: AuthRequest, res: Response) => {
    try {
        const parsed = createTestSchema.safeParse({
            ...req.body,
            lessonId: Number(req.body?.lessonId),
        });

        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid test payload" });
        }

        const user = req.user!;
        if (user.roleId !== ROLE_IDS.ADMIN && user.roleId !== ROLE_IDS.TEACHER) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { lessonId, title, questions } = parsed.data;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { authorId: true } } },
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        const allowed = await canManageCourse(user.userId, user.roleId, lesson.courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const hasCorrectAnswer = questions.every((question) =>
            question.answers.some((answer) => answer.isCorrect)
        );
        if (!hasCorrectAnswer) {
            return res.status(400).json({ message: "Each question must have at least one correct answer" });
        }

        const test = await prisma.test.create({
            data: {
                lessonId,
                title: title.trim(),
                questions: {
                    create: questions.map((question) => ({
                        text: question.text.trim(),
                        type: question.type || "single",
                        answers: {
                            create: question.answers.map((answer) => ({
                                text: answer.text.trim(),
                                isCorrect: answer.isCorrect,
                            })),
                        },
                    })),
                },
            },
            include: {
                questions: {
                    include: {
                        answers: {
                            select: { id: true, text: true },
                        },
                    },
                },
            },
        });

        res.status(201).json(test);
    } catch (error) {
        logger.error({ error }, "Error creating test");
        res.status(500).json({ message: "Error creating test" });
    }
};

// DELETE /tests/:id
export const deleteTest = async (req: AuthRequest, res: Response) => {
    try {
        const testId = Number(req.params.id);
        if (!Number.isInteger(testId) || testId <= 0) {
            return res.status(400).json({ message: "Invalid test id" });
        }

        const test = await prisma.test.findUnique({
            where: { id: testId },
            include: {
                lesson: {
                    select: { courseId: true },
                },
            },
        });
        if (!test) {
            return res.status(404).json({ message: "Test not found" });
        }

        const allowed = await canManageCourse(req.user!.userId, req.user!.roleId, test.lesson.courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const attempts = await prisma.testAttempt.findMany({
            where: { testId },
            select: { id: true },
        });
        const attemptIdList = attempts.map((attempt) => attempt.id);

        await prisma.$transaction(async (tx) => {
            if (attemptIdList.length) {
                await tx.testAnswer.deleteMany({ where: { attemptId: { in: attemptIdList } } });
            }
            await tx.testAttempt.deleteMany({ where: { testId } });
            await tx.answer.deleteMany({ where: { question: { testId } } });
            await tx.question.deleteMany({ where: { testId } });
            await tx.test.delete({ where: { id: testId } });
        });

        res.status(204).send();
    } catch (error) {
        logger.error({ error }, "Error deleting test");
        res.status(500).json({ message: "Error deleting test" });
    }
};