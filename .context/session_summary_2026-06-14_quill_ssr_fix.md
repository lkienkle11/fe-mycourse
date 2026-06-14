# Session summary — Quill SSR fix (2026-06-14)

## Problem
`GET /vi` returned 500: `ReferenceError: document is not defined` at `import Quill from "quill"` in `delta-editor.tsx`, pulled in via `@/components/shared` barrel when header imported `SearchBar`.

## Root cause
Quill accesses `document` at module evaluation. Next.js SSR evaluates the import chain even for `"use client"` modules.

## Solution (reuse existing code)
- Extended `src/lib/quill/delta-editor-quill.ts` with **`ensureQuillLoaded()`** — dynamic `import("quill")` + CSS on client only; internal `getQuill()` for helpers after load.
- Updated `src/components/shared/delta-editor.tsx` — `import type Quill`; await `ensureQuillLoaded()` in `useEffect` before `new Quill(...)`.
- Separate `useEffect` keeps `setQuillMediaEmbedRemoveLabel(removeEmbedLabel)` in sync on locale change.

## Quality
All pass in `fe-mycourse`:
- `npm run lint:biome`
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run quality:deps`

## Docs updated
- `docs/reusable-assets.md` — `ensureQuillLoaded` asset + SSR note
- `docs/folder-structure.md` — quill folder comments
- `docs/dependencies.md` — Quill lazy-load note
- `docs/modules.md` — quill module line
- `docs/patterns.md` — client-only library pattern
- `docs/quality.md` — audit date

## GitNexus
- `gitnexus_impact({ target: "delta-editor-quill.ts", direction: "upstream" })` → **LOW** risk
