module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:require-extensions/recommended",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "require-extensions", "neverthrow"],
    parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
    },
    ignorePatterns: [".eslint.cjs"],
    root: true,
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-floating-promises": "error",
        "neverthrow/must-use-result": "error",
    },
};
