export const ROLE_IDS = {
    STUDENT: 1,
    TEACHER: 2,
    ADMIN: 3,
} as const;

export const COURSE_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
} as const;

export type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];
