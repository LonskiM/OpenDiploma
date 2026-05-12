import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const updateAvatarSchema = z.object({
    avatarUrl: z.string().max(2_000_000),
});

export const createCourseSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
});

export const updateCourseSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
});

export const createLessonSchema = z.object({
    title: z.string().min(3),
    content: z.string().min(1),
    courseId: z.number().int().positive(),
    orderIndex: z.number().int().nonnegative(),
});

export const completeLessonSchema = z.object({
    lessonId: z.number().int().positive(),
});

export const createTestSchema = z.object({
    lessonId: z.number().int().positive(),
    title: z.string().min(3),
    questions: z.array(
        z.object({
            text: z.string().min(3),
            type: z.string().default("single"),
            answers: z.array(
                z.object({
                    text: z.string().min(1),
                    isCorrect: z.boolean(),
                })
            ).min(2),
        })
    ).min(1),
});

export const assignTeacherSchema = z.object({
    teacherUserId: z.number().int().positive(),
});

export const updateUserRoleSchema = z.object({
    roleId: z.number().int().positive(),
});

