import { Link } from "react-router-dom";
import { LoginForm } from "@/features/auth/ui/LoginForm";

const LoginCard = () => {
    return (
        <main className="auth-page">
            <section className="auth-card">
                <h1 className="auth-title">Sign in</h1>
                <LoginForm />
                <p className="auth-switch">
                    New here? <Link to="/register">Create account</Link>
                </p>
            </section>
        </main>
    );
};

export default LoginCard;
