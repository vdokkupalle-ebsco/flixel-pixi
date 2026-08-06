# ADR-0006: Isolate expensive Flash compatibility APIs

- Status: Accepted; API classification locks at C1
- Date: 2026-08-06
- Accepted: 2026-08-06 (Phase 0 architecture review)

## Context

`BitmapData` operations such as `stamp`, `replaceColor`, per-pixel overlap, and
bitmap-to-CSV can force canvas staging or GPU readback in a browser. Making them
ordinary core operations would hide severe performance costs.

## Decision

Keep semantically faithful, high-cost emulation in a separate compatibility
entry point where practical. Core APIs prefer textures, generated graphics, and
preprocessed assets. Unsupported cases receive documented replacements.

## Consequences

Legacy ports can opt into compatibility behavior without penalizing modern
games. C1 must benchmark representative operations before each API receives its
final Exact, Emulated, Deprecated, or Unsupported label.

## C1 validation

The 2026-08-06 CPU and Canvas prototypes confirm that mutable pixel operations
must remain outside core. `makeGraphic` and texture-frame selection are core
adaptations; `stamp`, `replaceColor`, mutable pixels, and cached per-pixel tests
are compatibility APIs. Arbitrary per-frame GPU readback is unsupported. See
[Phase 1 evidence](../phase1-evidence.md).
