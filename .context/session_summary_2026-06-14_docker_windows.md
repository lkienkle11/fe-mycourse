# Session addendum — Docker Windows scripts (FE)

**Date:** 2026-06-14  
**Scope:** `scripts/docker/*.ps1`, `*.cmd`, `_lib.ps1` — mirror bash; no TS/React changes.

## Added

| File | Role |
|------|------|
| `_lib.ps1` | Import `.env*` for build-args, compose invoke, HTTP poll (200/307/308) |
| `compose-up.ps1` … `swarm-deploy.ps1` | PowerShell entrypoints |
| `*.cmd` | CMD wrappers for Windows 10/11 |

## Docs synced

- `docs/docker.md`, `docs/folder-structure.md`, `README.md`

## Usage (CMD)

```cmd
scripts\docker\compose-up.cmd local
scripts\docker\health-check.cmd local
scripts\docker\compose-down.cmd local
```

## Quality gates

Re-run: biome, eslint, tsc, quality:deps, build — infra-only, expect PASS.
