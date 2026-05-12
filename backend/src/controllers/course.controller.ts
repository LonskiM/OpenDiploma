import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { assignTeacherSchema, createCourseSchema, updateCourseSchema } from "../validation/schemas";
import { logger } from "../utils/logger";
import { canManageCourse } from "../utils/coursePermissions";
import { COURSE_STATUS, ROLE_IDS } from "../constants/roles";

// GET /courses
export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                teachers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            }
        });

        res.json(courses);
    } catch (error) {
        logger.error({ error }, "Error fetching courses");
        res.status(500).json({ message: "Error fetching courses" });
    }
};

// GET /courses/:id
export const getCourseById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                lessons: {
                    include: {
                        tests: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                    orderBy: {
                        orderIndex: "asc",
                    },
                },
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                teachers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json(course);
    } catch (error) {
        logger.error({ error }, "Error fetching course");
        res.status(500).json({ message: "Error fetching course" });
    }
};

// POST /courses
export const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        const parsed = createCourseSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid course payload" });
        }
        const { title, description } = parsed.data;

        const course = await prisma.course.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                authorId: req.user!.userId,
                status: COURSE_STATUS.PENDING,
            },
        });

        res.json(course);
    } catch (error) {
        logger.error({ error }, "Error creating course");
        res.status(500).json({ message: "Error creating course" });
    }
};

// PUT /courses/:id
export const updateCourse = async (req: AuthRequest, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const parsed = updateCourseSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid course payload" });
        }

        const allowed = await canManageCourse(req.user!.userId, req.user!.roleId, id);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const updated = await prisma.course.update({
            where: { id },
            data: {
                title: parsed.data.title.trim(),
                description: parsed.data.description.trim(),
            },
        });

        res.json(updated);
    } catch (error) {
        logger.error({ error }, "Error updating course");
        res.status(500).json({ message: "Error updating course" });
    }
};

// POST /courses/:id/teachers
export const addTeacherToCourse = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = Number(req.params.id);
        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const parsed = assignTeacherSchema.safeParse({
            teacherUserId: Number(req.body?.teacherUserId),
        });
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid teacher payload" });
        }

        const allowed = await canManageCourse(req.user!.userId, req.user!.roleId, courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const teacher = await prisma.user.findUnique({
            where: { id: parsed.data.teacherUserId },
            select: { id: true, roleId: true },
        });
        if (!teacher) {
            return res.status(404).json({ message: "User not found" });
        }

        if (teacher.roleId !== ROLE_IDS.TEACHER && teacher.roleId !== ROLE_IDS.ADMIN) {
            return res.status(400).json({ message: "User must be teacher or admin" });
        }

        const relation = await prisma.courseTeacher.upsert({
            where: {
                courseId_userId: {
                    courseId,
                    userId: teacher.id,
                },
            },
            update: {},
            create: {
                courseId,
                userId: teacher.id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        roleId: true,
                    },
                },
            },
        });

        res.status(201).json(relation);
    } catch (error) {
        logger.error({ error }, "Error adding course teacher");
        res.status(500).json({ message: "Error adding course teacher" });
    }
};

// GET /courses/:id/test-attempts
export const getCourseTestAttempts = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = Number(req.params.id);
        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const allowed = await canManageCourse(req.user!.userId, req.user!.roleId, courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const attempts = await prisma.testAttempt.findMany({
            where: {
                test: {
                    lesson: {
                        courseId,
                    },
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                test: {
                    select: {
                        id: true,
                        title: true,
                        lesson: {
                            select: {
                                id: true,
                                title: true,
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
        });

        res.json(attempts.map((attempt) => ({
            id: attempt.id,
            score: attempt.score,
            total: attempt.test.questions.length,
            createdAt: attempt.createdAt,
            user: attempt.user,
            test: {
                id: attempt.test.id,
                title: attempt.test.title,
            },
            lesson: attempt.test.lesson,
        })));
    } catch (error) {
        logger.error({ error }, "Error fetching course test attempts");
        res.status(500).json({ message: "Error fetching course test attempts" });
    }
};

// DELETE /courses/:id
export const deleteCourse = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = Number(req.params.id);
        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        const allowed = await canManageCourse(req.user!.userId, req.user!.roleId, courseId);
        if (!allowed) {
            return res.status(403).json({ message: "Forbidden for this course" });
        }

        const lessonIds = await prisma.lesson.findMany({
            where: { courseId },
            select: { id: true },
        });
        const lessonIdList = lessonIds.map((lesson) => lesson.id);

        const testIds = lessonIdList.length
            ? await prisma.test.findMany({
                  where: { lessonId: { in: lessonIdList } },
                  select: { id: true },
              })
            : [];
        const testIdList = testIds.map((test) => test.id);

        const attemptIds = testIdList.length
            ? await prisma.testAttempt.findMany({
                  where: { testId: { in: testIdList } },
                  select: { id: true },
              })
            : [];
        const attemptIdList = attemptIds.map((attempt) => attempt.id);

        await prisma.$transaction(async (tx) => {
            await tx.courseTeacher.deleteMany({ where: { courseId } });
            await tx.userProgress.deleteMany({ where: { courseId } });

            if (attemptIdList.length) {
                await tx.testAnswer.deleteMany({ where: { attemptId: { in: attemptIdList } } });
            }
            if (testIdList.length) {
                await tx.testAttempt.deleteMany({ where: { testId: { in: testIdList } } });
                await tx.answer.deleteMany({ where: { question: { testId: { in: testIdList } } } });
                await tx.question.deleteMany({ where: { testId: { in: testIdList } } });
                await tx.test.deleteMany({ where: { id: { in: testIdList } } });
            }
            if (lessonIdList.length) {
                await tx.userLesson.deleteMany({ where: { lessonId: { in: lessonIdList } } });
                await tx.lesson.deleteMany({ where: { id: { in: lessonIdList } } });
            }

            await tx.course.delete({ where: { id: courseId } });
        });

        res.status(204).send();
    } catch (error) {
        logger.error({ error }, "Error deleting course");
        res.status(500).json({ message: "Error deleting course" });
    }
};