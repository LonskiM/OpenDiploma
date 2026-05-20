import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";

export const AppLayout = () => (
    <div className="app-shell">
        <AppHeader />
        <div className="app-main">
            <Outlet />
        </div>
    </div>
);
