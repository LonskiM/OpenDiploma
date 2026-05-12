import { api } from "@/shared/api/axios";
import type { Course } from "@/features/course/api/courseApi";

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    roleId: number;
    createdAt: string;
}

export const getUsers = async () => {
    const response = await api.get<AdminUser[]>("/admin/users");
    return response.data;
};

export const updateUserRole = async (userId: number, roleId: number) => {
    const response = await api.patch<AdminUser>(`/admin/users/${userId}/role`, { roleId });
    return response.data;
};

export const getPendingCourses = async () => {
    const response = await api.get<Course[]>("/admin/courses/pending");
    return response.data;
};

export const moderateCourse = async (courseId: number, status: "APPROVED" | "REJECTED") => {
    const response = await api.patch<Course>(`/admin/courses/${courseId}/moderation`, { status });
    return response.data;
};
