import { api } from "@/shared/api/axios";

export interface TestAnswerOption {
    id: number;
    text: string;
}

export interface TestQuestion {
    id: number;
    text: string;
    type: string;
    answers: TestAnswerOption[];
}

export interface TestData {
    id: number;
    title: string;
    lessonId: number;
    questions: TestQuestion[];
}

export interface SubmitAnswerPayload {
    questionId: number;
    answerId: number;
}

export interface SubmitTestResponse {
    score: number;
    total: number;
}

export interface CreateTestPayload {
    lessonId: number;
    title: string;
    questions: Array<{
        text: string;
        type: string;
        answers: Array<{
            text: string;
            isCorrect: boolean;
        }>;
    }>;
}

export const getTestById = async (id: number) => {
    const response = await api.get<TestData>(`/tests/${id}`);
    return response.data;
};

export const submitTest = async (id: number, answers: SubmitAnswerPayload[]) => {
    const response = await api.post<SubmitTestResponse>(`/tests/${id}/submit`, {
        answers,
    });
    return response.data;
};

export const createTest = async (payload: CreateTestPayload) => {
    const response = await api.post<TestData>("/tests", payload);
    return response.data;
};

export const deleteTest = async (testId: number) => {
    await api.delete(`/tests/${testId}`);
};
