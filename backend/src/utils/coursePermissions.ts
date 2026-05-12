import { prisma } from "./prisma";
import { ROLE_IDS } from "../constants/roles";

export const canManageCourse = async (userId: number, roleId: number, courseId: number) => {
    if (roleId === ROLE_IDS.ADMIN) {
        return true;
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
            authorId: true,
            teachers: {
                where: { userId },
                select: { id: true },
            },
        },
    });

    if (!course) {
        return false;
    }

    return course.authorId === userId || course.teachers.length > 0;
};
