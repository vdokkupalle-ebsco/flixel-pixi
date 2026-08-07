# Phase 13 / C13 completion plan (hardening → release)

**Date:** 2026-08-07  
**Goal:** Close remaining C13 gates after the partial hardening pass + DX track.

## Already done

- Atlas sprite FPS baselines (2k/5k/10k), short soak, evidence doc
- Game-maker DX (world sync, `createBrowserGame`, actions, pools)

## Workstream (this pass)

1. **Perf:** Stop per-frame full world sync when membership is unchanged (dirty flag). Re-measure benches.
2. **Soft gates:** Chromium soft FPS floors for 2k (and maybe 5k) once stable; 10k stays report-only longer if needed.
3. **Soak:** Extend CI soak (more cycles / longer run) + optional long soak script; keep richer probes best-effort.
4. **Matrix:** Run phase13 Playwright on Firefox/WebKit; note WebGPU fallback status.
5. **Release prep:** CHANGELOG, version `1.0.0-rc` or `1.0.0`, upgrade notes — **npm publish only after explicit OK**.

## Non-goals this hour

- Full 30-minute soak in default CI
- Guaranteed multi-device hardware lab
