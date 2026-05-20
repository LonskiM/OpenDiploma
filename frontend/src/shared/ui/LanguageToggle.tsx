import { useTranslation, type Locale } from "@/shared/lib/i18n";

const LanguageToggle = () => {
    const { locale, setLocale, t } = useTranslation();

    const nextLocale: Locale = locale === "ru" ? "en" : "ru";

    return (
        <button
            type="button"
            className="icon-toggle lang-toggle"
            onClick={() => setLocale(nextLocale)}
            aria-label={t("lang.toggle")}
            title={t("lang.toggle")}
        >
            {locale === "ru" ? t("lang.en") : t("lang.ru")}
        </button>
    );
};

export default LanguageToggle;
