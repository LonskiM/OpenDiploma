import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store/store";
import { logout } from "@/features/auth/model/authSlice";
import { useTranslation } from "@/shared/lib/i18n";
import LanguageToggle from "@/shared/ui/LanguageToggle";
import ThemeToggle from "@/shared/ui/ThemeToggle";

const navItems = [
    { to: "/courses", labelKey: "nav.courses", icon: "▣" },
    { to: "/profile", labelKey: "nav.profile", icon: "◉" },
] as const;

export const AppHeader = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const onLogout = () => {
        dispatch(logout());
        navigate("/login", { replace: true });
    };

    return (
        <header className="app-header">
            <NavLink to="/courses" className="app-header-brand">
                <span className="brand-mark" aria-hidden>
                    L
                </span>
                <span className="brand-name">{t("auth.brand")}</span>
            </NavLink>

            <nav className="app-header-nav" aria-label={t("nav.main")}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `header-nav-link${isActive ? " active" : ""}`
                        }
                    >
                        <span className="header-nav-icon" aria-hidden>
                            {item.icon}
                        </span>
                        <span>{t(item.labelKey)}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="app-header-actions">
                <ThemeToggle />
                <LanguageToggle />
                <div className="header-user">
                    <span className="header-user-name">{user?.name ?? t("common.user")}</span>
                </div>
                <button type="button" className="ghost-button" onClick={onLogout}>
                    {t("nav.signOut")}
                </button>
            </div>
        </header>
    );
};
