import { useState } from "react";
import type { FormEvent } from "react";
import { getMe, login } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setAuth } from "../model/authSlice";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";
import { useTranslation } from "@/shared/lib/i18n";

export const LoginForm = () => {
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
            const data = await login(email.trim(), password);
            if (!data?.token) {
                setError(t("auth.invalidResponse"));
                return;
            }
            const user = await getMe(data.token);

            dispatch(
                setAuth({
                    user,
                    token: data.token,
                })
            );
            navigate("/courses", { replace: true });
        } catch (loginError) {
            setError(getApiErrorMessage(loginError, t("auth.loginFailed")));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={onSubmit}>
            <div className="field">
                <label className="field-label" htmlFor="login-email">
                    {t("auth.email")}
                </label>
                <input
                    id="login-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                />
            </div>
            <div className="field">
                <label className="field-label" htmlFor="login-password">
                    {t("auth.password")}
                </label>
                <input
                    id="login-password"
                    type="password"
                    placeholder={t("auth.passwordLoginPlaceholder")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
            </div>
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
            </button>
        </form>
    );
};
