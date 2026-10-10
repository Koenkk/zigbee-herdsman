# Agents Instructions for zigbee-herdsman

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always respect the exact versions of Node.js, TypeScript, and libraries used in this project
2. **Codebase Patterns**: Scan the codebase for established patterns before generating code
3. **Architectural Consistency**: Maintain the layered architecture and established module boundaries
4. **Performance**: Keep to best-practices to maintain high performance
5. **Code Quality**: Prioritize maintainability, type safety, and consistency with existing patterns
6. **Testing**: Follow the established Vitest testing patterns

## Technology Stack & Versions

### Core Technologies

- **Runtime**: Node.js
- **Language**: TypeScript
- **Package Manager**: pnpm

### Development Tools

- **Testing**: Vitest with @vitest/coverage-v8
- **Benchmarking**: Vitest
- **Code Quality**: Biome (formatting, linting)
- **Build**: TypeScript compiler

## Project Architecture

### Project Structure

```
src/
├── index.ts           # Public API exports
├── adapter/           # Hardware adapter layer (Z-Stack, EZSP, etc.)
├── buffalo/           # Binary data serialization/deserialization
├── controller/        # Core business logic
│   ├── controller.ts  # Main controller orchestration
│   ├── database.ts    # Persistence layer
│   ├── helpers/       # Shared utilities
│   └── model/         # Domain models (Device, Endpoint, Group)
├── models/            # Backup and configuration models
├── utils/             # Cross-cutting utilities
└── zspec/             # Zigbee specification implementation
    ├── zcl/           # Zigbee Cluster Library
    └── zdo/           # Zigbee Device Objects
test/                  # Vitest test/bench files with mocks
dist/                  # Compiled JavaScript output
```

### Key Architectural Principles

1. **Separation of Concerns**: Adapter layer handles hardware communication, controller handles business logic
2. **Entity Pattern**: Device, Endpoint, Group, Entity form a hierarchy
3. **Event-Driven**: Controller extends EventEmitter for loose coupling
4. **Static Caching**: Device and Group use static Maps for singleton-like behavior
5. **Database Abstraction**: All persistence goes through `database.ts`

## Code Style & Formatting

See [Biome configuration](biome.json)

## Code Documentation

Use JSDoc, following existing patterns.

## Additional Resources

- [Official API Documentation](https://koenkk.github.io/zigbee-herdsman)
- [GitHub Repository](https://github.com/Koenkk/zigbee-herdsman)
- Related Project: [Zigbee2MQTT](https://www.zigbee2mqtt.io/)
