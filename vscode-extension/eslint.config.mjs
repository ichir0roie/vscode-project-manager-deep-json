import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["out", "dist", "node_modules", "**/*.d.ts"] },
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            curly: "warn",
            eqeqeq: "warn",
            "no-throw-literal": "warn",
        },
    },
);
