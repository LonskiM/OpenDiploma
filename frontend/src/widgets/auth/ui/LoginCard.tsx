import { Link } from "react-router-dom";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { useTranslation } from "@/shared/lib/i18n";
import AuthToolbar from "@/shared/ui/AuthToolbar";

const LoginCard = () => {
    const { t } = useTranslation();

    return (
        <main className="auth-page">
            <AuthToolbar />
            <section className="auth-card">
                <div className="auth-eyebrow">
                    <span className="auth-logo-mark" aria-hidden>
                        <span>L</span>
                    </span>
                    <span className="auth-brand">{t("auth.brand")}</span>
                </div>
                <h1 className="auth-title">{t("auth.signInTitle")}</h1>
                <p className="auth-desc">{t("auth.signInDesc")}</p>
                <LoginForm />
                <p className="auth-switch">
                    {t("auth.newHere")}{" "}
                    <Link to="/register">{t("auth.createAccountLink")}</Link>
                </p>
            </section>
        </main>
    );
};

export default LoginCard;
