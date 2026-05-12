import { api } from "@/shared/api/axios";

export interface AuthUser {
    id: number;
    name?: string;
    email: string;
    avatarUrl?: string;
    roleId?: number;
}

export const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", {
        email,
        password,
    });

    return response.data;
};

export const register = async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
        name,
        email,
        password,
    });

    return response.data;
};

export const getMe = async (token: string) => {
    const response = await api.get<{ user: AuthUser }>("/auth/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data.user;
};

export const updateMyAvatar = async (avatarUrl: string) => {
    const response = await api.patch<{ user: AuthUser }>("/auth/me/avatar", { avatarUrl });
    return response.data.user;
};