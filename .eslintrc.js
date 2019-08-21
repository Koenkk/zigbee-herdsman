module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['plugin:@typescript-eslint/recommended'],
    rules: {
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/semi": ["error"],
        "indent": ["error", 4],
        "max-len": ["error", { "code": 120 }],
        "object-curly-spacing": ["error", "never"],
        "array-bracket-spacing": ["error", "never"]
    }
}