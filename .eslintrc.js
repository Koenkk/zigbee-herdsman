module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        "project": "./tsconfig.json",
    },
    plugins: ['@typescript-eslint', 'perfectionist'],
    extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
    rules: {
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/ban-ts-ignore": "off",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/semi": ["error"],
        "array-bracket-spacing": ["error", "never"],
        "no-return-await": "error",
        "object-curly-spacing": ["error", "never"],
        "@typescript-eslint/no-floating-promises": "error",
        "perfectionist/sort-imports": [
            "error",
            {
              "groups": [
                "type",
                [
                  "builtin",
                  "external"
                ],
                "internal-type",
                "internal",
                [
                  "parent-type",
                  "sibling-type",
                  "index-type"
                ],
                [
                  "parent",
                  "sibling",
                  "index"
                ],
                "object",
                "unknown"
              ],
              "customGroups": {
                "value": {},
                "type": {}
              },
              "newlinesBetween": "always",
              "internalPattern": [
                "~/**"
              ],
              "type": "natural",
              "order": "asc",
              "ignoreCase": false
            }
        ],
    }
}
