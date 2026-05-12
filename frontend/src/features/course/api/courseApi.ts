import { api } from "@/shared/api/axios";

export interface Course {
    id: number;
    title: string;
    description: string;
    authorId: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    author?: {
        id: number;
        name: string;
        email: string;
    };
    teachers?: Array<{
        id: number;
        userId: number;
        user: {
            id: number;
            name: string;
            email: string;
            roleId?: number;
        };
    }>;
}

export interface Lesson {
    id: number;
    title: string;
    content: string;
    orderIndex: number;
    courseId: number;
    tests?: Array<{
        id: number;
        title: string;
    }>;
}

export interface CourseDetails extends Course {
    lessons: Lesson[];
}

export interface LessonDetails {
    id: number;
    title: string;
    content: string;
    orderIndex: number;
    courseId: number;
    tests: Array<{
        id: number;
        title: string;
    }>;
}

export const getCourses = async () => {
    const response = await api.get<Course[]>("/courses");
    return response.data;
};

export const getCourseById = async (id: number) => {
    const response = await api.get<CourseDetails>(`/courses/${id}`);
    return response.data;
};

export const getLessonsByCourse = async (courseId: number) => {
    const response = await api.get<Lesson[]>(`/courses/${courseId}/lessons`);
    return response.data;
};

export const getLessonById = async (lessonId: number) => {
    const response = await api.get<LessonDetails>(`/lessons/${lessonId}`);
    return response.data;
};

export const createCourse = async (title: string, description: string) => {
    const response = await api.post<Course>("/courses", { title, description });
    return response.data;
};

export const updateCourse = async (courseId: number, title: string, description: string) => {
    const response = await api.put<Course>(`/courses/${courseId}`, { title, description });
    return response.data;
};

export const deleteCourse = async (courseId: number) => {
    await api.delete(`/courses/${courseId}`);
};

export const createLesson = async (payload: {
    title: string;
    content: string;
    courseId: number;
    orderIndex: number;
}) => {
    const response = await api.post<Lesson>("/lessons", payload);
    return response.data;
};

export const deleteLesson = async (lessonId: number) => {
    await api.delete(`/lessons/${lessonId}`);
};

export interface CourseTestAttempt {
    id: number;
    score: number;
    total: number;
    createdAt: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    test: {
        id: number;
        title: string;
    };
    lesson: {
        id: number;
        title: string;
    };
}

export const addTeacherToCourse = async (courseId: number, teacherUserId: number) => {
    const response = await api.post(`/courses/${courseId}/teachers`, {
        teacherUserId,
    });
    return response.data;
};

export const getCourseTestAttempts = async (courseId: number) => {
    const response = await api.get<CourseTestAttempt[]>(`/courses/${courseId}/test-attempts`);
    return response.data;
};
