module.exports = {
    transform: {
        ".(ts|tsx)": "ts-jest"
    },
    moduleDirectories: ["<rootDir>/node_modules", "src"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
    testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules"],
}