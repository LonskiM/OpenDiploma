import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";

export const ProtectedRoute = () => {
    const isAuth = useSelector((state: RootState) => state.auth.isAuth);

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
