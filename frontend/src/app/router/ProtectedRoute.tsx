import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";

export const ProtectedRoute = ({
                                   children,
                               }: {
    children: React.ReactNode;
}) => {
    const isAuth = useSelector(
        (state: RootState) => state.auth.isAuth
    );

    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    return children;
};