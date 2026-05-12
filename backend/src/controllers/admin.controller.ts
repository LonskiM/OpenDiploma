import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { updateUserRoleSchema } from "../validation/schemas";
import { COURSE_STATUS, ROLE_IDS } from "../constants/roles";

const assertAdmin = (req: AuthRequest, res: Response) => {
    if (req.user?.roleId !== ROLE_IDS.ADMIN) {
        res.status(403).json({ message: "Forbidden" });
        return false;
    }
    return true;
};

// GET /admin/users
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        if (!assertAdmin(req, res)) {
            return;
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json(users);
    } catch (error) {
        logger.error({ error }, "Error fetching users");
        res.status(500).json({ message: "Error fetching users" });
    }
};

// PATCH /admin/users/:id/role
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        if (!assertAdmin(req, res)) {
            return;
        }

        const userId = Number(req.params.id);
        const parsed = updateUserRoleSchema.safeParse({
            roleId: Number(req.body?.roleId),
        });
        if (!Number.isInteger(userId) || userId <= 0 || !parsed.success) {
            return res.status(400).json({ message: "Invalid role payload" });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { roleId: parsed.data.roleId },
            select: {
                id: true,
                name: true,
                email: true,
                roleId: true,
            },
        });

        res.json(updated);
    } catch (error) {
        logger.error({ error }, "Error updating user role");
        res.status(500).json({ message: "Error updating user role" });
    }
};

// GET /admin/courses/pending
export const getPendingCourses = async (req: AuthRequest, res: Response) => {
    try {
        if (!assertAdmin(req, res)) {
            return;
        }

        const courses = await prisma.course.findMany({
            where: { status: COURSE_STATUS.PENDING },
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json(courses);
    } catch (error) {
        logger.error({ error }, "Error fetching pending courses");
        res.status(500).json({ message: "Error fetching pending courses" });
    }
};

// PATCH /admin/courses/:id/moderation
export const moderateCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!assertAdmin(req, res)) {
            return;
        }

        const courseId = Number(req.params.id);
        const nextStatus = String(req.body?.status ?? "").toUpperCase();
        if (!Number.isInteger(courseId) || courseId <= 0) {
            return res.status(400).json({ message: "Invalid course id" });
        }

        if (nextStatus !== COURSE_STATUS.APPROVED && nextStatus !== COURSE_STATUS.REJECTED) {
            return res.status(400).json({ message: "Status must be APPROVED or REJECTED" });
        }

        const updated = await prisma.course.update({
            where: { id: courseId },
            data: { status: nextStatus },
        });

        res.json(updated);
    } catch (error) {
        logger.error({ error }, "Error moderating course");
        res.status(500).json({ message: "Error moderating course" });
    }
};
