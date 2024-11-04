module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:require-extensions/recommended",
        "plugin:vue/vue3-recommended",
        "prettier",
    ],
    parser: "vue-eslint-parser",
    plugins: ["@typescript-eslint", "require-extensions"],
    parserOptions: {
        parser: "@typescript-eslint/parser",
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        extraFileExtensions: [".vue"],
    },
    ignorePatterns: [".eslintrc.cjs", "dist", "vite.config.ts"],
    root: true,
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-floating-promises": "error",
    },
};
