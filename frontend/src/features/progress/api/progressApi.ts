import { api } from "@/shared/api/axios";

export interface CourseProgressItem {
    id: number;
    courseId: number;
    completedLessons: number;
    progressPercent: number;
    course: {
        id: number;
        title: string;
    };
}

export interface TestAttemptItem {
    id: number;
    score: number;
    total: number;
    createdAt: string;
    test: {
        id: number;
        title: string;
    };
    lesson: {
        id: number;
        title: string;
    };
    course: {
        id: number;
        title: string;
    };
}

export interface ProfileProgressResponse {
    courseProgress: CourseProgressItem[];
    testAttempts: TestAttemptItem[];
}

export const getMyProgress = async () => {
    const response = await api.get<ProfileProgressResponse>("/progress/me");
    return response.data;
};

export const completeLesson = async (lessonId: number) => {
    const response = await api.post("/progress/complete-lesson", { lessonId });
    return response.data;
};
