import { useTheme } from "@/app/providers/ThemeProvider";
import { useTranslation } from "@/shared/lib/i18n";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <button
            type="button"
            className="icon-toggle"
            onClick={toggleTheme}
            aria-label={t("theme.toggle")}
            title={theme === "dark" ? t("theme.light") : t("theme.dark")}
        >
            <span aria-hidden>{theme === "dark" ? "☀" : "☾"}</span>
        </button>
    );
};

export default ThemeToggle;
