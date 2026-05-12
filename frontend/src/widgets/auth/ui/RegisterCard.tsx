import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getMe, login, register } from "@/features/auth/api/authApi";
import { setAuth } from "@/features/auth/model/authSlice";
import { getApiErrorMessage } from "@/shared/lib/getApiErrorMessage";

const RegisterCard = () => {
    const [name, setName] = useState("");
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
            await register(name.trim(), email.trim(), password);
            const auth = await login(email.trim(), password);
            const user = await getMe(auth.token);

            dispatch(setAuth({ user, token: auth.token }));
            navigate("/courses", { replace: true });
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, "Registration failed. Try another email."));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1 className="auth-title">Create account</h1>
                <form className="auth-form" onSubmit={onSubmit}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        minLength={2}
                        required
                    />
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
                        minLength={6}
                        required
                    />
                    {error ? <p className="auth-error">{error}</p> : null}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create account"}
                    </button>
                </form>
                <p className="auth-switch">
                    Already have account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
};

export default RegisterCard;
