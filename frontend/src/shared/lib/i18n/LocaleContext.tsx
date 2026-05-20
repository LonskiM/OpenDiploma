import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { createTranslator, type TranslateFn } from "./translate";

export type Locale = "ru" | "en";

const LOCALE_STORAGE_KEY = "lms-locale";

interface LocaleContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const readStoredLocale = (): Locale => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return stored === "en" ? "en" : "ru";
};

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const value = useMemo<LocaleContextValue>(() => {
        const tree = locale === "en" ? en : ru;
        return {
            locale,
            setLocale,
            t: createTranslator(tree),
        };
    }, [locale, setLocale]);

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useTranslation = () => {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error("useTranslation must be used within LocaleProvider");
    }
    return context;
};
