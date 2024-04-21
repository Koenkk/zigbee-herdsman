module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        "project": "./tsconfig.json",
    },
    plugins: ['@typescript-eslint'],
    extends: ['plugin:@typescript-eslint/recommended'],
    rules: {
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/semi": ["error"],
        "array-bracket-spacing": ["error", "never"],
        "indent": ["error", 4],
        "max-len": ["error", { "code": 150 }],
        "no-return-await": "error",
        "object-curly-spacing": ["error", "never"],
        "@typescript-eslint/no-floating-promises": "error",
    }
}