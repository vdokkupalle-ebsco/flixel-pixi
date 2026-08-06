# ADR-0011: Browser storage via replaceable backend with versioned slots

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 9 save spike)

## Context

AS3 `FlxSave` wraps Flash `SharedObject`, which provides persistent key-value
storage with automatic serialization and a flush/close lifecycle. The browser
equivalent is `localStorage` (synchronous, ~5–10 MB quota) with `IndexedDB` as
an optional higher-capacity asynchronous alternative.

Flash silently lost data on quota failure. The port must surface errors so games
can react, and it must handle malformed stored JSON without crashing.

## Decision

`FlxSave` owns a `data` record, a `name`, and a bind/flush/erase/close/destroy
lifecycle. It delegates storage operations to a replaceable `FlxStorageBackend`
resolved from the `FlxContext` service map via `FLX_STORAGE_SERVICE`.

The default implementation (`LocalStorageBackend`) namespaces keys as
`flixel:{name}`, serializes data as JSON, and wraps `setItem` in try/catch to
detect `QuotaExceededError`. On read, malformed JSON returns `null` and logs a
console warning rather than throwing.

`bind()` accepts an optional `version` and `migrate` callback. The stored record
includes a `__version` field. When the loaded version differs from the requested
version, `migrate(oldData, oldVersion)` runs and the result replaces the data.

An `IndexedDBBackend` is available as an opt-in for games that need larger or
async-compatible storage. It wraps a pre-opened `IDBDatabase` with the same
synchronous-style `FlxStorageBackend` interface using micro-task transactions.

A `NullStorageBackend` provides an in-memory `Map` for headless unit tests.

`FlxG.save` and `FlxG.saves` delegate to the context's storage service.

## Consequences

Games using `localStorage` continue to work with a synchronous API.
`flush()` returns a typed `FlxSaveResult` with explicit `quota`,
`serialization`, and `unknown` error categories. Schema migrations run once
per version bump on `bind()`. IndexedDB users opt in explicitly. Headless tests
never touch browser storage. Namespaced keys avoid collisions with other web
applications.
