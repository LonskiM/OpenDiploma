export const ROLE_IDS = {
    STUDENT: 1,
    TEACHER: 2,
    ADMIN: 3,
} as const;

export const isTeacherRole = (roleId?: number) =>
    roleId === ROLE_IDS.TEACHER || roleId === ROLE_IDS.ADMIN;

export const isAdminRole = (roleId?: number) => roleId === ROLE_IDS.ADMIN;
