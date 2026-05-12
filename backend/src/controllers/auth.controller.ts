import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema, updateAvatarSchema } from "../validation/schemas";
import { logger } from "../utils/logger";
import { AuthRequest } from "../middleware/auth.middleware";
import { ROLE_IDS } from "../constants/roles";

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
};

const ensureSystemRoles = async () => {
    await prisma.role.upsert({
        where: { id: ROLE_IDS.STUDENT },
        update: { name: "STUDENT" },
        create: { id: ROLE_IDS.STUDENT, name: "STUDENT" },
    });
    await prisma.role.upsert({
        where: { id: ROLE_IDS.TEACHER },
        update: { name: "TEACHER" },
        create: { id: ROLE_IDS.TEACHER, name: "TEACHER" },
    });
    await prisma.role.upsert({
        where: { id: ROLE_IDS.ADMIN },
        update: { name: "ADMIN" },
        create: { id: ROLE_IDS.ADMIN, name: "ADMIN" },
    });
};

// REGISTER
export const register = async (req: Request, res: Response) => {
    try {
        await ensureSystemRoles();
        const parsed = registerSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid register payload" });
        }
        const { name, email, password } = parsed.data;

        // проверка
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                passwordHash: hashedPassword,
                roleId: ROLE_IDS.STUDENT,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                roleId: true,
                createdAt: true,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        logger.error({ error }, "Error registering user");
        res.status(500).json({ message: "Error registering user" });
    }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const parsed = loginSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid login payload" });
        }
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, roleId: user.roleId },
            getJwtSecret(),
            { expiresIn: "1d" }
        );

        res.json({ token });
    } catch (error) {
        logger.error({ error }, "Error logging in");
        res.status(500).json({ message: "Error logging in" });
    }
};

// GET /auth/me
export const me = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                roleId: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user });
    } catch (error) {
        logger.error({ error }, "Error loading current user");
        res.status(500).json({ message: "Error loading current user" });
    }
};

// PATCH /auth/me/avatar
export const updateMyAvatar = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const parsed = updateAvatarSchema.safeParse({
            avatarUrl: String(req.body?.avatarUrl ?? ""),
        });
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid avatar payload" });
        }

        const updated = await prisma.user.update({
            where: { id: req.user.userId },
            data: { avatarUrl: parsed.data.avatarUrl },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                roleId: true,
            },
        });

        res.json({ user: updated });
    } catch (error) {
        logger.error({ error }, "Error updating avatar");
        res.status(500).json({ message: "Error updating avatar" });
    }
};