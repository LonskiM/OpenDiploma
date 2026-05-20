import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

const AuthToolbar = () => (
    <div className="auth-toolbar">
        <ThemeToggle />
        <LanguageToggle />
    </div>
);

export default AuthToolbar;
