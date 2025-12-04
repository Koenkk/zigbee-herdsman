# GitHub Copilot Instructions for zigbee-herdsman

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always respect the exact versions of Node.js, TypeScript, and libraries used in this project
2. **Codebase Patterns**: Scan the codebase for established patterns before generating code
3. **Architectural Consistency**: Maintain the layered architecture and established module boundaries
4. **Code Quality**: Prioritize maintainability, type safety, and consistency with existing patterns
5. **Testing**: Follow the established Vitest testing patterns

## Technology Stack & Versions

### Core Technologies

- **Runtime**: Node.js (CommonJS module system)
- **Language**: TypeScript 5.9.2
  - Target: ES2022
  - Module: NodeNext
  - Strict mode enabled (`strict: true`, `noImplicitAny: true`, `noImplicitThis: true`)
- **Package Manager**: pnpm 10.12.1

### Key Dependencies

- **Serial Communication**: `@serialport/stream` (^13.0.0), `@serialport/bindings-cpp` (^13.0.1)
- **Network Discovery**: `bonjour-service` (^1.3.0)
- **Utilities**: `fast-deep-equal` (^3.1.3), `debounce` (^2.2.0), `mixin-deep` (^2.0.1)
- **Zigbee Adapters**: Support for Z-Stack, EZSP/EmberZNet, deCONZ, Zigate, ZBOSS, ZOH

### Development Tools

- **Testing**: Vitest 3.2.4 with @vitest/coverage-v8
- **Code Quality**: Biome 2.2.5 (formatting, linting)
- **Build**: TypeScript compiler with incremental compilation

## Project Architecture

### Layered Structure

```
src/
├── index.ts                 # Public API exports
├── adapter/                 # Hardware adapter layer (Z-Stack, EZSP, etc.)
├── buffalo/                 # Binary data serialization/deserialization
├── controller/              # Core business logic
│   ├── controller.ts       # Main controller orchestration
│   ├── database.ts         # Persistence layer
│   ├── helpers/            # Shared utilities
│   └── model/              # Domain models (Device, Endpoint, Group)
├── models/                  # Backup and configuration models
├── utils/                   # Cross-cutting utilities
└── zspec/                   # Zigbee specification implementation
    ├── zcl/                # Zigbee Cluster Library
    └── zdo/                # Zigbee Device Objects
```

### Key Architectural Principles

1. **Separation of Concerns**: Adapter layer handles hardware communication, controller handles business logic
2. **Entity Pattern**: Device, Endpoint, Group, Entity form a hierarchy
3. **Event-Driven**: Controller extends EventEmitter for loose coupling
4. **Static Caching**: Device and Group use static Maps for singleton-like behavior
5. **Database Abstraction**: All persistence goes through `database.ts`

## Code Style & Formatting

### Biome Configuration

The project uses Biome for code quality enforcement. Key settings:

- **Indentation**: 4 spaces
- **Line Width**: 150 characters
- **Bracket Spacing**: false (e.g., `{foo}` not `{ foo }`)
- **Naming Conventions**: Flexible (camelCase, PascalCase, snake_case, CONSTANT_CASE allowed based on context)
- **No Non-Null Assertions**: Discouraged except in test files (use `!` sparingly)
- **Unused Imports**: Error level

### Import Organization

Follow this pattern observed in the codebase:

```typescript
// 1. Node.js built-ins
import assert from "node:assert";
import events from "node:events";

// 2. External dependencies
import mixinDeep from "mixin-deep";

// 3. Internal imports (relative paths, grouped by layer)
import {Adapter, type Events as AdapterEvents} from "../adapter";
import {logger} from "../utils/logger";
import * as Zcl from "../zspec/zcl";
import * as Zdo from "../zspec/zdo";

// 4. Relative imports from same layer
import Database from "./database";
import {Device, Entity} from "./model";
```

## Naming Conventions

### Variables and Properties

- **Private fields**: Use `#` prefix for true private fields: `#customClusters`, `#genBasic`
- **Internal properties**: Use `_` prefix: `_members`, `_endpoints`, `_ieeeAddr`
- **Public properties**: camelCase: `groupID`, `networkAddress`, `interviewState`
- **Constants**: SCREAMING_SNAKE_CASE in dedicated files or modules
- **Static members**: camelCase for methods, PascalCase for types

### Functions and Methods

- **Public methods**: camelCase: `addMember()`, `removeFromNetwork()`, `getDevice()`
- **Private methods**: camelCase: `toDatabaseRecord()`, `fromDatabaseEntry()`
- **Static factory methods**: camelCase: `byGroupID()`, `byIeeeAddr()`
- **Iterators**: Suffix with `Iterator`: `allIterator()`, `getDevicesIterator()`

### Classes and Types

- **Classes**: PascalCase: `Controller`, `Device`, `Endpoint`, `Group`
- **Interfaces**: PascalCase: `Options`, `DatabaseEntry`, `ConfigureReportingItem`
- **Type Aliases**: PascalCase for complex types, camelCase for simple unions
- **Enums**: PascalCase with CONSTANT_CASE or PascalCase members

### Files

- **Source files**: camelCase: `controller.ts`, `zclFrameConverter.ts`
- **Test files**: camelCase with `.test.ts` suffix: `controller.test.ts`
- **Type definition files**: camelCase: `tstype.ts`, `tstypes.ts`

## TypeScript Patterns

### Type Safety

Always use explicit types for public APIs:

```typescript
// ✅ Good: Explicit return type
public async write<Cl extends number | string>(
    clusterKey: Cl,
    attributes: PartialClusterOrRawWriteAttributes<Cl>,
    options?: Options,
): Promise<void> {
    // ...
}

// ✅ Good: Explicit parameter types
private constructor(databaseID: number, groupID: number, members: Endpoint[], meta: KeyValue) {
    // ...
}
```

### Generic Constraints

Use constrained generics for cluster-related operations:

```typescript
public async command<
    Cl extends number | string,
    Co extends number | string,
    Custom extends TCustomCluster | undefined = undefined
>(
    clusterKey: Cl,
    commandKey: Co,
    payload: ClusterOrRawPayload<Cl, Co, Custom>,
    options?: Options,
): Promise<undefined> {
    // ...
}
```

### Type Guards and Assertions

```typescript
// Use typeof checks
if (typeof source === "number") {
    // Handle number case
}

// Use assert for preconditions
assert(typeof groupID === "number", "GroupID must be a number");
assert(groupID >= 1, "GroupID must be at least 1");

// Avoid non-null assertions except in tests
// biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
logger.debug(err.stack!, NS);
```

### Readonly Properties

Use `readonly` for immutable properties:

```typescript
public readonly groupID: number;
public readonly meta: KeyValue;
private readonly _members: Endpoint[];
private static readonly groups: Map<number, Group> = new Map();
```

## Async/Await Patterns

### Consistent Async Usage

```typescript
// ✅ Good: Always return Promise<void> or Promise<Type>
public async removeFromNetwork(): Promise<void> {
    for (const endpoint of this._members) {
        await endpoint.removeFromGroup(this);
    }
    this.removeFromDatabase();
}

// ✅ Good: Sequential awaits when order matters
const startResult = await this.adapter.start();
const coordinatorIEEE = await this.adapter.getCoordinatorIEEE();

// ✅ Good: Parallel awaits when independent
// (Use sparingly, most operations in this codebase are sequential)
```

### Error Handling

Follow this pattern for async methods:

```typescript
const createLogMessage = (): string =>
    `Write ${this.groupID} ${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(optionsWithDefaults)})`;
logger.debug(createLogMessage, NS);

try {
    // Operation logic
    await Entity.adapter.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
} catch (error) {
    const err = error as Error;
    err.message = `${createLogMessage()} failed (${err.message})`;
    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
    logger.debug(err.stack!, NS);
    throw error;
}
```

## Class Design Patterns

### Entity Hierarchy

```typescript
// Base entity class
export abstract class Entity<EventMap> {
    protected static adapter: Adapter;
    protected static database: Database;
    // ...
}

// Zigbee-specific entity
export abstract class ZigbeeEntity extends Entity<ControllerEventMap> {
    protected getOptionsWithDefaults(...): OptionsWithDefaults {
        // Shared logic
    }
}

// Concrete implementations
export class Group extends ZigbeeEntity { }
export class Device extends Entity<ControllerEventMap> { }
```

### Static Factory Pattern

```typescript
export class Group extends ZigbeeEntity {
    private static readonly groups: Map<number, Group> = new Map();
    private static loadedFromDatabase = false;

    // Private constructor
    private constructor(databaseID: number, groupID: number, members: Endpoint[], meta: KeyValue) {
        super();
        // ...
    }

    // Static factory methods
    public static byGroupID(groupID: number): Group | undefined {
        Group.loadFromDatabaseIfNecessary();
        return Group.groups.get(groupID);
    }

    public static create(groupID: number): Group {
        assert(typeof groupID === "number", "GroupID must be a number");
        // Validation, creation, and caching logic
    }
}
```

### Lazy Loading Pattern

```typescript
private static loadFromDatabaseIfNecessary(): void {
    if (!Group.loadedFromDatabase) {
        for (const entry of Entity.database.getEntriesIterator(["Group"])) {
            const group = Group.fromDatabaseEntry(entry);
            Group.groups.set(group.groupID, group);
        }
        Group.loadedFromDatabase = true;
    }
}
```

### Iterator Pattern

Prefer generators over returning full arrays:

```typescript
// ✅ Modern: Use generator
public static *allIterator(predicate?: (value: Group) => boolean): Generator<Group> {
    Group.loadFromDatabaseIfNecessary();
    for (const group of Group.groups.values()) {
        if (!predicate || predicate(group)) {
            yield group;
        }
    }
}

// ⚠️ Deprecated but still present
public static all(): Group[] {
    Group.loadFromDatabaseIfNecessary();
    return Array.from(Group.groups.values());
}
```

## Logging Patterns

### Logger Usage

Always use the logger utility with namespace:

```typescript
import {logger} from "../../utils/logger";

const NS = "zh:controller:group";

// Debug logging (most common)
logger.debug(`Device announce from '${payload.eui64}:${payload.nwkAddress}'`, NS);

// Lambda for deferred computation
logger.debug(() => `Expensive computation: ${JSON.stringify(complexObject)}`, NS);

// Info for important state changes
logger.info(`Install code was adjusted for reason '${adjusted}'.`, NS);

// Warning for recoverable issues
logger.warning(`Ignoring unknown attribute ${attribute} in cluster ${cluster.name}`, NS);

// Error for failures
logger.error(`Failed to disable join on stop: ${error}`, NS);
```

### Log Message Patterns

```typescript
// ✅ Create reusable log message function
const createLogMessage = (): string =>
    `Write ${this.groupID} ${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(optionsWithDefaults)})`;

logger.debug(createLogMessage, NS);

// Later in catch block
err.message = `${createLogMessage()} failed (${err.message})`;
```

## Error Handling

### Type-Safe Error Handling

```typescript
try {
    await operation();
} catch (error) {
    // Always cast to Error type
    const err = error as Error;
    err.message = `Operation failed (${err.message})`;
    logger.debug(err.stack!, NS);
    throw error;  // Re-throw the original error
}
```

### Validation with Assertions

```typescript
// Use node:assert for precondition checks
assert(typeof groupID === "number", "GroupID must be a number");
assert(groupID >= 1, "GroupID must be at least 1");

// Throw Error for business logic violations
if (Group.groups.has(groupID)) {
    throw new Error(`Group with groupID '${groupID}' already exists`);
}
```

## Testing Patterns

### Test Structure

```typescript
import {describe, expect, it, vi, beforeEach, afterAll} from "vitest";

describe("Feature Name", () => {
    beforeEach(() => {
        // Setup
    });

    it("should do something specific", async () => {
        // Arrange
        const mockLogger = {
            debug: vi.fn(),
            info: vi.fn(),
            warning: vi.fn(),
            error: vi.fn(),
        };

        // Act
        const result = await operation();

        // Assert
        expect(result).toBe(expectedValue);
        expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining("expected message"));
    });
});
```

### Mocking Patterns

```typescript
// Mock with vi.fn()
const mockAdapterStart = vi.fn().mockReturnValue("resumed");
const mockAdapter = {
    start: mockAdapterStart,
    getCoordinatorIEEE: vi.fn().mockReturnValue("0x0000012300000000"),
};

// Mock logger
const mockLogger = {
    debug: vi.fn((messageOrLambda) => {
        if (typeof messageOrLambda === "function") messageOrLambda();
    }),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
};
```

## Database Patterns

### CRUD Operations

```typescript
// Create
const databaseID = Entity.database.newID();
const group = new Group(databaseID, groupID, [], {});
Entity.database.insert(group.toDatabaseRecord());

// Read
for (const entry of Entity.database.getEntriesIterator(["Group"])) {
    const group = Group.fromDatabaseEntry(entry);
}

// Update
public save(writeDatabase = true): void {
    Entity.database.update(this.toDatabaseRecord(), writeDatabase);
}

// Delete
public removeFromDatabase(): void {
    if (Entity.database.has(this.databaseID)) {
        Entity.database.remove(this.databaseID);
    }
    Group.groups.delete(this.groupID);
}
```

### Serialization Pattern

```typescript
// To database
private toDatabaseRecord(): DatabaseEntry {
    const members: DatabaseEntry["members"] = [];
    for (const member of this._members) {
        const device = member.getDevice();
        if (device) {
            members.push({deviceIeeeAddr: device.ieeeAddr, endpointID: member.ID});
        }
    }
    return {id: this.databaseID, type: "Group", groupID: this.groupID, members, meta: this.meta};
}

// From database
private static fromDatabaseEntry(entry: DatabaseEntry): Group {
    const members: Endpoint[] = [];
    for (const member of entry.members) {
        const device = Device.byIeeeAddr(member.deviceIeeeAddr);
        if (device) {
            const endpoint = device.getEndpoint(member.endpointID);
            if (endpoint) {
                members.push(endpoint);
            }
        }
    }
    return new Group(entry.id, entry.groupID, members, entry.meta);
}
```

## Zigbee-Specific Patterns

### ZCL Frame Creation

```typescript
const frame = Zcl.Frame.create(
    Zcl.FrameType.GLOBAL,  // or SPECIFIC
    optionsWithDefaults.direction,
    true,  // disableDefaultResponse
    optionsWithDefaults.manufacturerCode,
    optionsWithDefaults.transactionSequenceNumber ?? zclTransactionSequenceNumber.next(),
    "write",  // command name
    cluster,
    payload,
    customClusters,
    optionsWithDefaults.reservedBits,
);
```

### Cluster Resolution

```typescript
const customClusters = this.#customClusters[
    options?.direction === Zcl.Direction.SERVER_TO_CLIENT ? 1 : 0
];
const cluster = Zcl.Utils.getCluster(clusterKey, options?.manufacturerCode, customClusters);
```

### Options with Defaults Pattern

```typescript
private getOptionsWithDefaults(
    options: Options | undefined,
    direction: Zcl.Direction,
    manufacturerCode: number | undefined,
): OptionsWithDefaults {
    return {
        direction,
        srcEndpoint: undefined,
        reservedBits: 0,
        manufacturerCode,
        transactionSequenceNumber: undefined,
        ...(options || {}),
    };
}
```

## Documentation Patterns

### JSDoc Comments

Use JSDoc for public APIs:

```typescript
/**
 * Create a controller
 *
 * To auto detect the port provide `null` for `options.serialPort.path`
 */
public constructor(options: Options) {
    // ...
}

/**
 * @deprecated use allIterator()
 */
public static all(): Group[] {
    // ...
}

/**
 * @noInheritDoc
 */
export class Controller extends events.EventEmitter<ControllerEventMap> {
    // ...
}
```

### Inline Comments

Use comments sparingly for complex logic:

```typescript
// Don't allow groupID 0, from the spec:
// "Scene identifier 0x00, along with group identifier 0x0000, is reserved for the global scene used by the OnOff cluster"
assert(groupID >= 1, "GroupID must be at least 1");

// Use default direction if not specified
const customClusters = this.#customClusters[options?.direction === Zcl.Direction.SERVER_TO_CLIENT ? 1 : 0 /* default to CLIENT_TO_SERVER */];
```

## Performance Patterns

### Avoid Premature Array Creation

```typescript
// ✅ Good: Use iterator for filtering
get members(): Endpoint[] {
    return this._members.filter((e) => e.getDevice() !== undefined);
}

// ✅ Good: Generator for large collections
public static *allIterator(predicate?: (value: Group) => boolean): Generator<Group> {
    for (const group of Group.groups.values()) {
        if (!predicate || predicate(group)) {
            yield group;
        }
    }
}
```

### Cache Invalidation

```typescript
public addMember(endpoint: Endpoint): void {
    if (!this._members.includes(endpoint)) {
        this._members.push(endpoint);
        this.save();
        // Invalidate derived cache
        this.#customClusters = this.#identifyCustomClusters();
    }
}
```

## Version Control & Project Management

### Semantic Versioning

The project follows semantic versioning (current: 6.2.0):
- Major: Breaking API changes
- Minor: New features, backward compatible
- Patch: Bug fixes

### Breaking Changes

Document breaking changes in CHANGELOG.md:

```markdown
## 0.14.0 breaking changes
- `sendWhenActive` has been replaced with `sendWhen: 'active'`
```

## Common Patterns Checklist

When implementing new features, ensure:

- [ ] Private fields use `#` prefix for encapsulation
- [ ] Public methods have explicit return types
- [ ] Async methods return `Promise<Type>`
- [ ] Error messages include context from `createLogMessage()`
- [ ] Logger calls include the appropriate namespace constant
- [ ] Static caches are invalidated when data changes
- [ ] Database operations go through `save()`, not direct access
- [ ] Type assertions use `as` not angle brackets
- [ ] Iterators are preferred over array methods for large collections
- [ ] Tests use Vitest with mocks via `vi.fn()`
- [ ] Options objects have a `getOptionsWithDefaults()` method
- [ ] Assertions validate input parameters early
- [ ] Import statements follow the ordering convention

## Anti-Patterns to Avoid

- ❌ Don't use `any` type (use `unknown` then narrow)
- ❌ Don't bypass static factory methods with `new` for entities
- ❌ Don't mutate readonly properties after construction
- ❌ Don't log sensitive data (use `HIDDEN` placeholder or lambdas)
- ❌ Don't use `console.log` (use logger utility)
- ❌ Don't ignore errors (always catch, log, and re-throw or handle)
- ❌ Don't create circular dependencies between layers
- ❌ Don't use non-null assertions outside of tests without biome-ignore comment

## Additional Resources

- [Official API Documentation](https://koenkk.github.io/zigbee-herdsman)
- [GitHub Repository](https://github.com/Koenkk/zigbee-herdsman)
- Related Project: [Zigbee2MQTT](https://www.zigbee2mqtt.io/)

---

**Remember**: When in doubt, scan similar files in the codebase for patterns. Consistency with existing code is more important than external best practices that don't match the project's established style.
