import { LocaleProvider } from "@/shared/lib/i18n";
import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "./ThemeProvider";

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
    <StoreProvider>
        <ThemeProvider>
            <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
    </StoreProvider>
);
