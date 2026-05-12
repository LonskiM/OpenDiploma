import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoginPage from "@/pages/LoginPage";
import CoursesPage from "@/pages/CoursesPage";
import { ProtectedRoute } from "./ProtectedRoute";
import RegisterPage from "@/pages/RegisterPage";
import CoursePage from "@/pages/CoursePage";
import ProfilePage from "@/pages/ProfilePage";
import TestPage from "@/pages/TestPage";
import LessonPage from "@/pages/LessonPage";
import { getMe } from "@/features/auth/api/authApi";
import { logout, setAuth } from "@/features/auth/model/authSlice";
import type { RootState } from "@/app/store/store";

const AuthBootstrap = () => {
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.auth.token);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        const hydrate = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            if (user) {
                setLoading(false);
                return;
            }

            try {
                const me = await getMe(token);
                dispatch(setAuth({ user: me, token }));
            } catch {
                dispatch(logout());
            } finally {
                setLoading(false);
            }
        };

        void hydrate();
    }, [dispatch, token, user]);

    if (loading) {
        return <main className="page">Loading session...</main>;
    }

    return null;
};

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <AuthBootstrap />
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/courses" replace />}
                />
                <Route
                    path="/login"
                    element={<LoginPage />}
                />
                <Route
                    path="/register"
                    element={<RegisterPage />}
                />
                <Route
                    path="/courses"
                    element={
                        <ProtectedRoute>
                            <CoursesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/courses/:id"
                    element={
                        <ProtectedRoute>
                            <CoursePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tests/:id"
                    element={
                        <ProtectedRoute>
                            <TestPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/lessons/:id"
                    element={
                        <ProtectedRoute>
                            <LessonPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/courses" replace />} />
            </Routes>
        </BrowserRouter>
    );
};