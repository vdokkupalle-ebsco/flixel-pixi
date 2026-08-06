# ADR-0005: Use explicit asynchronous assets

- Status: Accepted
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 0 architecture review)

## Context

AS3 games used synchronous `[Embed]` classes. Browser assets are URLs or
resources loaded asynchronously, and PixiJS v8 provides a promise-based cached
asset service.

## Decision

Add a typed `FlxAssets` service over Pixi `Assets`. Games preload bundles before
constructing dependent states or await explicit factory methods. Constructors
must not silently start network requests.

## Consequences

Startup becomes asynchronous and migration requires replacing embedded class
references. Loading failures, retries, cache ownership, and state-bundle unload
become explicit and testable.
