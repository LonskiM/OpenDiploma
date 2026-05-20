import type { TranslationTree } from "./types";

type Primitive = string | number;
type InterpolationParams = Record<string, Primitive>;

const getNestedValue = (tree: TranslationTree, path: string): string | undefined => {
    const parts = path.split(".");
    let current: unknown = tree;

    for (const part of parts) {
        if (current === null || typeof current !== "object" || !(part in current)) {
            return undefined;
        }
        current = (current as Record<string, unknown>)[part];
    }

    return typeof current === "string" ? current : undefined;
};

const interpolate = (template: string, params?: InterpolationParams): string => {
    if (!params) {
        return template;
    }

    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        const value = params[key];
        return value === undefined ? `{${key}}` : String(value);
    });
};

export const createTranslator = (tree: TranslationTree) => {
    return (key: string, params?: InterpolationParams): string => {
        const value = getNestedValue(tree, key);
        if (value === undefined) {
            return key;
        }
        return interpolate(value, params);
    };
};

export type TranslateFn = ReturnType<typeof createTranslator>;
