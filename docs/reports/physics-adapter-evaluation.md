# Physics adapter evaluation

**Decision date:** 2026-08-24  
**Reference adapter:** Planck.js 1.4.2  
**Alternative evaluated:** `@dimforge/rapier2d-compat` 0.20.0

## Decision

Use [Planck.js 1.4.2](https://github.com/piqnt/planck.js/tree/v1.4.2) for the first
reference adapter and keep it in the private
`@flixel-pixi/physics-planck` workspace until the package contract is approved.

Planck is the better reference implementation for the current prerelease:

- its synchronous JavaScript API fits `FlxPhysicsBackendWorld` without adding an
  asynchronous engine-startup state;
- the evaluated runtime input is about 55 kB gzipped, versus about 791 kB for
  the Rapier compatibility module;
- version 1.4.2 supports the repository's Node 22.12 compatibility floor;
- its Box2D model maps directly to the initial portable body, fixture, filter,
  contact, and query vocabulary;
- it works in both browser and headless JavaScript environments without a WASM
  loading path.

Rapier is substantially faster in this synthetic sparse-body benchmark and is
still a strong future adapter. It was not selected as the reference because its
WASM initialization and size would make the first integration, examples, and
consumer setup less representative of the smallest optional-physics path.

Planck 1.5.0 was not selected because its published package declares Node 24 or
newer. Pinning 1.4.2 preserves the repository's Node 22.12 support. The pin is
checked by `npm run check:physics-adapter`.

## Comparison

| Criterion | Planck.js 1.4.2 | Rapier 2D compat 0.20.0 |
| --- | --- | --- |
| License | MIT | Apache-2.0 |
| Runtime | Synchronous JavaScript | WebAssembly with asynchronous initialization |
| Evaluated Node floor | Node 14+ | Compatible with the repository runtime in the prototype |
| Browser/headless setup | Same constructor in both | Compatibility package initializes WASM before world creation |
| Shape fit | Box, circle, convex polygon, compound fixtures | Broad rigid-body and collider support |
| Queries | Point/AABB via fixture traversal, ray cast | Native scene queries |
| Contacts | Contact list/manifold and sensor state | Event queues and narrow-phase contact data |
| Determinism claim exposed by adapter | No | Not evaluated for the portable replay contract |
| Explicit resource release | Remove bodies and references | `world.free()` releases WASM resources |
| Evaluated runtime input, gzip | 55,326 bytes | 791,243 bytes |
| TypeScript | Published declarations | Published declarations |
| Reference documentation | [Planck API](https://piqnt.com/planck.js/docs/api/) | [Rapier JavaScript guide](https://rapier.rs/docs/user_guides/javascript/getting_started_js/) |

The size figures are compressed source inputs, not guaranteed application
bundle deltas. A consumer bundler, minifier, source-map policy, and imported
surface can change the final result.

## Prototype benchmark

The prototype created dynamic square bodies in a sparse grid under gravity.
Each measurement used 30 warm-up steps followed by 120 measured steps at
1/60 second. It ran once in Node with `--expose-gc`; heap figures are deltas from
`process.memoryUsage().heapUsed` and should be treated as directional.

| Bodies | Adapter | Create (ms) | Mean step (ms) | Destroy (ms) | Heap delta |
| ---: | --- | ---: | ---: | ---: | ---: |
| 100 | Planck | 4.15 | 0.128 | 0.33 | 2.61 MiB |
| 100 | Rapier | 3.15 | 0.057 | 0.68 | 0.96 MiB |
| 1,000 | Planck | 13.32 | 0.915 | 0.87 | 12.64 MiB |
| 1,000 | Rapier | 7.57 | 0.296 | 0.14 | 3.34 MiB |
| 5,000 | Planck | 40.84 | 6.886 | 6.90 | 40.61 MiB |
| 5,000 | Rapier | 34.09 | 1.054 | 0.44 | 12.88 MiB |

These numbers compare solver overhead in one artificial workload. They are not
a game-performance guarantee: dense contacts, sleeping, joints, continuous
collision, and browser/WASM behavior can change the ranking and absolute cost.

## Reference adapter boundary

`@flixel-pixi/physics-planck` owns all solver-specific conversion and state:

- Flixel logical pixels convert to solver metres at the adapter boundary;
- public angles and angular velocities use degrees and degrees per second;
- fixture category/mask bits remain unsigned 16-bit values and group indices
  remain signed 16-bit values;
- Planck bodies never appear in portable contacts, queries, or serialized
  project schemas;
- `backend.native.getBody(portableId)` is the explicit opt-in escape hatch for
  solver-specific code;
- Planck remains absent from the published `flixel-pixi` root artifact.

The first adapter deliberately reports no joints, capsules, debug geometry, or
deterministic replay capability. Portable code receives the standard capability
error before body creation or query execution instead of failing inside Planck.

## Release gates

Before making the adapter public:

1. Run its conformance suite in Node and the browser playground.
2. Keep reset/destroy soak coverage and the package byte budgets green.
3. Verify the root `flixel-pixi` tarball contains no Planck dependency or code.
4. Assign a prerelease version compatible with the engine release.
5. Set npm provenance metadata, remove `private`, and document independent
   installation and versioning.

## Revisit triggers

Add or reconsider a Rapier adapter when a project needs one of these outcomes:

- materially higher body counts or denser simulation workloads;
- solver features that are intentionally outside the Planck adapter;
- deterministic-WASM experiments with a dedicated replay validation matrix;
- an application already paying the Rapier/WASM initialization and bundle cost.

The portable contract should not grow to mirror either solver. New shared
features require two credible implementations or a clear capability-gated
extension design.
