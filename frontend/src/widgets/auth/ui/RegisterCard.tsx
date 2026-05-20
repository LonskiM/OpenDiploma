import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getMe, login, register } from "@/features/auth/api/authApi";
import { setAuth } from "@/features/auth/model/authSlice";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { useTranslation } from "@/shared/lib/i18n";
import AuthToolbar from "@/shared/ui/AuthToolbar";

const RegisterCard = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await register(name.trim(), email.trim(), password);
            const auth = await login(email.trim(), password);
            const user = await getMe(auth.token);

            dispatch(setAuth({ user, token: auth.token }));
            navigate("/courses", { replace: true });
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, t("auth.registerFailed")));
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <h1 className="auth-title">{t("auth.createAccountTitle")}</h1>
                <p className="auth-desc">{t("auth.createAccountDesc")}</p>
                <form className="auth-form" onSubmit={onSubmit}>
                    <div className="field">
                        <label className="field-label" htmlFor="register-name">
                            {t("auth.name")}
                        </label>
                        <input
                            id="register-name"
                            type="text"
                            placeholder={t("auth.namePlaceholder")}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            minLength={2}
                            required
                        />
                    </div>
                    <div className="field">
                        <label className="field-label" htmlFor="register-email">
                            {t("auth.email")}
                        </label>
                        <input
                            id="register-email"
                            type="email"
                            placeholder={t("auth.emailPlaceholder")}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>
                    <div className="field">
                        <label className="field-label" htmlFor="register-password">
                            {t("auth.password")}
                        </label>
                        <input
                            id="register-password"
                            type="password"
                            placeholder={t("auth.passwordPlaceholder")}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={6}
                            required
                        />
                    </div>
                    {error ? <p className="auth-error">{error}</p> : null}
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? t("auth.creating") : t("auth.createAccount")}
                    </button>
                </form>
                <p className="auth-switch">
                    {t("auth.haveAccount")} <Link to="/login">{t("auth.signInLink")}</Link>
                </p>
            </section>
        </main>
    );
};

export default RegisterCard;
