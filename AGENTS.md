# AGENTS.md

## Project Overview

zigbee-herdsman is an open source Zigbee gateway solution built with Node.js. It provides a TypeScript library for communicating with Zigbee devices through various adapter types (Z-Stack, EZSP/EmberZNet, deCONZ, Zigate, ZBOSS, ZOH).

**Key Technologies:**
- TypeScript 5.9.2 (target ES2022, module NodeNext, strict mode)
- Node.js with CommonJS modules
- Package Manager: pnpm 10.12.1 (enforced)
- Testing: Vitest 3.2.4
- Code Quality: Biome 2.2.5 (linting + formatting)
- Serial Communication: @serialport packages

**Architecture:**
- Layered architecture with clear separation between adapter (hardware), controller (business logic), and model layers
- Event-driven design using Node.js EventEmitter
- Static factory pattern for entities (Device, Group)
- Database abstraction layer for persistence

## Setup Commands

Install dependencies (pnpm is required):
```bash
pnpm install
```

Build TypeScript to JavaScript:
```bash
pnpm run build
```

Clean build artifacts:
```bash
pnpm run clean
```

## Development Workflow

### Watch Mode for Development

Build TypeScript in watch mode (auto-recompile on changes):
```bash
pnpm run build:watch
```

### Code Quality Checks

Run Biome linting and formatting checks:
```bash
pnpm run check
```

Auto-fix linting and formatting issues:
```bash
pnpm run check:w
```

**Important:** Always run `pnpm run check` before committing. The CI will fail if there are any Biome errors or warnings.

### Project Structure

```
src/
├── index.ts                 # Public API exports
├── adapter/                 # Hardware adapter implementations
│   ├── z-stack/            # Texas Instruments Z-Stack
│   ├── ember/              # Silicon Labs EmberZNet
│   ├── ezsp/               # EZSP protocol
│   ├── deconz/             # deCONZ adapter
│   ├── zigate/             # Zigate adapter
│   ├── zboss/              # ZBOSS adapter
│   └── zoh/                # Zigbee-on-Host adapter
├── buffalo/                # Binary serialization/deserialization
├── controller/             # Core business logic
│   ├── controller.ts       # Main controller class
│   ├── database.ts         # Persistence layer
│   ├── helpers/            # Shared utilities
│   └── model/              # Domain models (Device, Endpoint, Group)
├── models/                 # Backup and configuration models
├── utils/                  # Cross-cutting utilities
└── zspec/                  # Zigbee specification
    ├── zcl/                # Zigbee Cluster Library
    └── zdo/                # Zigbee Device Objects
```

### Build Output

- Compiled JavaScript goes to `dist/` directory
- Type definitions (.d.ts) are generated alongside JavaScript
- Source maps are generated for debugging
- The package exports `dist/index.js` as the main entry point

## Testing Instructions

Run all tests:
```bash
pnpm run test
```

Run tests with coverage report:
```bash
pnpm run test:coverage
```

Run tests in watch mode:
```bash
pnpm run test:watch
```

Run benchmarks:
```bash
pnpm run bench
```

**Test Configuration:**
- Tests are in the `test/` directory
- Test files use `.test.ts` suffix
- Configuration: `test/vitest.config.mts`
- Coverage target: 100% (enforced)
- Default timeout: 10000ms (configured in CI)

**Running Specific Tests:**

Focus on a specific test file:
```bash
pnpm vitest run test/controller.test.ts --config ./test/vitest.config.mts
```

Focus on a specific test by name:
```bash
pnpm vitest run -t "test name pattern" --config ./test/vitest.config.mts
```

**Test Patterns:**
- Use Vitest's `describe`, `it`, `expect`, `beforeEach`, `afterAll`, `vi` (for mocking)
- Mock adapters and logger in tests (see `test/mockAdapters.ts`, `test/mockDevices.ts`)
- Tests for model classes should test CRUD operations, static factories, and business logic
- Always mock external dependencies (serial ports, adapters, file system)

## Code Style Guidelines

### Language and Framework Conventions

**TypeScript:**
- Strict mode enabled (`strict: true`, `noImplicitAny: true`, `noImplicitThis: true`)
- Target ES2022, use modern JavaScript features
- Use `import` with Node.js `node:` prefix for built-ins: `import assert from "node:assert"`
- Always provide explicit return types for public methods
- Use `readonly` for immutable properties
- Prefer `const` over `let`, never use `var`

**Naming Conventions:**
- Private fields: Use `#` prefix (e.g., `#customClusters`, `#genBasic`)
- Internal properties: Use `_` prefix (e.g., `_members`, `_ieeeAddr`)
- Public properties/methods: camelCase (e.g., `groupID`, `addMember()`)
- Classes/Interfaces: PascalCase (e.g., `Controller`, `Device`, `Options`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `NS = "zh:controller:group"`)
- Static factory methods: camelCase (e.g., `byGroupID()`, `byIeeeAddr()`)
- Iterators: Suffix with `Iterator` (e.g., `allIterator()`)

**Import Organization:**
1. Node.js built-ins (with `node:` prefix)
2. External dependencies
3. Internal imports (grouped by layer)
4. Relative imports from same layer

Example:
```typescript
import assert from "node:assert";
import events from "node:events";
import mixinDeep from "mixin-deep";
import {Adapter, type Events as AdapterEvents} from "../adapter";
import {logger} from "../utils/logger";
import * as Zcl from "../zspec/zcl";
import Database from "./database";
```

### Formatting Rules (Biome)

- Indentation: 4 spaces
- Line width: 150 characters
- Bracket spacing: false (`{foo}` not `{ foo }`)
- No semicolons are automatically enforced
- Use double quotes for strings
- Trailing commas where valid

### Linting Rules

**Key enforced rules:**
- `noUnusedImports`: error
- `noUnusedVariables`: warning
- `useThrowNewError`: error - always use `new Error()`
- `useAwait`: error - don't mark functions async if they don't await
- `noNonNullAssertion`: off in tests, discouraged in source (use with biome-ignore comment)

**Naming flexibility:**
- Object properties, const, and type properties can use: camelCase, PascalCase, snake_case, or CONSTANT_CASE
- Enum members: CONSTANT_CASE or PascalCase

### Error Handling Patterns

Always cast errors to Error type:
```typescript
try {
    await operation();
} catch (error) {
    const err = error as Error;
    err.message = `Operation failed (${err.message})`;
    logger.debug(err.stack!, NS);
    throw error;
}
```

Use assertions for preconditions:
```typescript
import assert from "node:assert";
assert(typeof groupID === "number", "GroupID must be a number");
assert(groupID >= 1, "GroupID must be at least 1");
```

### Logging Patterns

Use the logger utility with namespace constants:
```typescript
import {logger} from "../../utils/logger";

const NS = "zh:controller:group";

logger.debug(`Message with ${interpolation}`, NS);
logger.info("Important state change", NS);
logger.warning("Recoverable issue", NS);
logger.error("Failure", NS);

// For expensive operations, use lambda
logger.debug(() => `Expensive: ${JSON.stringify(large)}`, NS);
```

### Async/Await

- Always return `Promise<Type>` explicitly for async methods
- Use sequential awaits when order matters (most operations)
- Use `Promise.all()` sparingly when operations are truly independent
- Create a `createLogMessage()` function for logging before try/catch blocks

## Build and Deployment

### Build Process

Compile TypeScript:
```bash
pnpm run build
```

This runs `tsc` which:
- Compiles `src/**/*.ts` to `dist/`
- Generates declaration files (.d.ts)
- Generates source maps
- Uses incremental compilation (tsconfig.tsbuildinfo)

### Pre-publish Steps

The `prepack` script runs automatically before publishing:
```bash
pnpm run prepack
```

This cleans and rebuilds everything:
1. `pnpm run clean` - removes temp, coverage, dist, tsconfig.tsbuildinfo
2. `pnpm run build` - fresh TypeScript compilation

### Package Contents

Only these files are included in npm package (see `files` in package.json):
- `./dist` - compiled JavaScript and type definitions
- `./CHANGELOG.md` - version history

### Environment

- Node.js version: 24 (used in CI)
- Package manager: pnpm 10.12.1 (strictly enforced via `packageManager` field)
- Module system: CommonJS (`type: "commonjs"`)

## CI/CD Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on:
- Push to `master` branch
- Push of version tags (`v*.*.*`)
- All pull requests

**CI Steps:**
1. Checkout code
2. Setup pnpm and Node.js 24
3. `pnpm i --frozen-lockfile` - install with exact versions
4. `pnpm run check` - Biome linting (fails on warnings)
5. `pnpm run build` - TypeScript compilation
6. `pnpm run test:coverage -- --testTimeout=10000` - run tests with coverage
7. `pnpm run bench` - run benchmarks (on master and PRs, not on release-please branches)
8. Publish to npm (only on version tags)

**Before creating a PR, ensure:**
```bash
pnpm run check  # No errors or warnings
pnpm run build  # Successful compilation
pnpm run test   # All tests pass
```

## Pull Request Guidelines

**Title Format:**
Use descriptive titles that clearly indicate the change. No strict format required, but be specific.

**Required Checks Before Submission:**
```bash
pnpm run check    # Must pass with no errors or warnings
pnpm run build    # Must compile successfully
pnpm run test     # All tests must pass
```

**Code Review Requirements:**
- Follow existing code patterns (see `.github/copilot-instructions.md` for detailed patterns)
- Maintain 100% test coverage
- Add tests for new code
- Update tests when modifying existing code
- Use TypeScript strict mode - no `any` types
- Follow the established architecture (adapter/controller/model layers)

## Architecture and Design Patterns

### Entity Pattern

The project uses an entity hierarchy:
- `Entity<EventMap>` - base class
- `ZigbeeEntity` - extends Entity with Zigbee-specific logic
- `Device`, `Group` - concrete implementations

### Static Factory Pattern

Entities use static factories with caching:
```typescript
Device.byIeeeAddr(ieeeAddr)      // Find device by IEEE address
Device.byNetworkAddress(address)  // Find device by network address
Group.byGroupID(groupID)         // Find group by ID
Device.create(...)                // Create new device
Group.create(groupID)             // Create new group
```

### Iterator Pattern

Prefer generators over arrays:
```typescript
Device.allIterator()              // Generator for all devices
Group.allIterator(predicate?)     // Generator for groups with optional filter
```

### Database Abstraction

All persistence goes through `controller/database.ts`:
- `Entity.database.insert(record)` - create
- `Entity.database.update(record)` - update
- `Entity.database.remove(id)` - delete
- `Entity.database.getEntriesIterator(types?)` - read

Entities implement:
- `toDatabaseRecord()` - serialize to database format
- `fromDatabaseEntry(entry)` - deserialize from database

## Common Pitfalls and Troubleshooting

### Build Issues

**Issue:** TypeScript compilation errors
- **Solution:** Ensure you're using TypeScript 5.9.2: `pnpm list typescript`
- **Solution:** Clean and rebuild: `pnpm run clean && pnpm run build`

**Issue:** Incremental build issues
- **Solution:** Delete `tsconfig.tsbuildinfo` and rebuild

### Test Issues

**Issue:** Tests timeout
- **Solution:** Default timeout is 10000ms. Increase in specific tests if needed.
- **Solution:** Check for missing mocks or unresolved promises

**Issue:** Coverage not at 100%
- **Solution:** Add tests for uncovered lines
- **Solution:** Test files themselves don't need coverage (in `test/` directory)

### Code Quality Issues

**Issue:** Biome check fails
- **Solution:** Run `pnpm run check:w` to auto-fix formatting issues
- **Solution:** For unfixable issues, address linting errors manually
- **Solution:** Use `// biome-ignore lint/rule/name: reason` for justified exceptions

**Issue:** Non-null assertion errors
- **Solution:** Avoid using `!` except in tests
- **Solution:** If necessary in source, add `// biome-ignore lint/style/noNonNullAssertion: justification`

### Import Issues

**Issue:** Module resolution errors
- **Solution:** Use `node:` prefix for Node.js built-ins
- **Solution:** Check tsconfig.json `module: "NodeNext"` and `moduleResolution: "NodeNext"`
- **Solution:** Use relative paths for internal imports

### Adapter Development

When working with adapters:
- Each adapter is in its own subdirectory under `src/adapter/`
- All adapters extend the base `Adapter` class
- Adapters handle hardware-specific communication
- Controller layer should not contain adapter-specific logic

## Additional Context

**Related Projects:**
- [Zigbee2MQTT](https://github.com/Koenkk/zigbee2mqtt) - Uses zigbee-herdsman as its core Zigbee communication library
- [ioBroker](https://github.com/ioBroker) - Home automation platform using zigbee-herdsman

**Documentation:**
- API Documentation: https://koenkk.github.io/zigbee-herdsman
- GitHub Copilot Instructions: `.github/copilot-instructions.md` (comprehensive coding patterns)

**Version Management:**
- Follows semantic versioning (currently 6.2.0)
- Breaking changes are documented in CHANGELOG.md
- Release Please manages releases automatically

**Package Dependencies:**
- Serial communication via `@serialport/*` packages
- Network discovery via `bonjour-service`
- Utilities: `fast-deep-equal`, `debounce`, `mixin-deep`
- All dependencies use exact or caret versions

**Development Tips:**
- Use the example in `examples/join-and-log.js` to understand basic usage
- Run tests in watch mode while developing: `pnpm run test:watch`
- Keep build in watch mode for faster iteration: `pnpm run build:watch`
- Check coverage locally before pushing: `pnpm run test:coverage`
- Reference `.github/copilot-instructions.md` for detailed coding patterns and conventions
