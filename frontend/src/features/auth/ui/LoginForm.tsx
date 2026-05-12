import { useState } from "react";
import type { FormEvent } from "react";
import { getMe, login } from "../api/authApi";
import { useDispatch } from "react-redux";
import { setAuth } from "../model/authSlice";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

export const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError(null);
        setIsSubmitting(true);

        try {
            const data = await login(email.trim(), password);
            if (!data?.token) {
                setError("Invalid server response");
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

        } catch (error) {
            setError(getApiErrorMessage(error, "Login failed. Check your credentials."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={onSubmit}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
            />
            {error ? <p className="auth-error">{error}</p> : null}
            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
};
