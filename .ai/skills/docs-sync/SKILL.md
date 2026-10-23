---
name: docs-sync
description: Update project documentation after an in-scope task that changes behavior, routes, shared code or architecture. Map each change to its target docs file, edit only the touched entries, replace outdated text instead of appending, keep each file's language, verify paths and links, and move the sprint-log row when an OpenSpec change is archived. Use after any in-scope implementation task before the final response.
---

# Docs sync

Keeps the fixed documentation set in `docs/` equal to the code after a task. It does not add files and does not append changelogs.

## When to use

After any in-scope task that changes behavior, routes, shared code or architecture; and when an OpenSpec change is archived.

## Procedure

1. List what the task changed: `git status --short` and `git diff --stat` (plus untracked files).
2. Map every change to a target file with the table in "Repository specifics".
3. Open only the matching entry (or section) and edit it: replace outdated sentences with the current behavior, add what is missing, delete what no longer exists. Never append a "changelog" paragraph or leave old and new descriptions side by side. If several files describe the same fact, update them all consistently (or keep it in one place and point to it).
4. Keep each file's existing language, tone and format. Do not translate a file and do not mix languages inside one file unless it is multilingual by design.
5. Verify: every backticked repository path exists (`test -e`), every markdown link and anchor in the files you touched resolves, no heading is duplicated across docs files, and removed or renamed symbols no longer appear (`grep -rn <name> docs`).
6. When an OpenSpec change is archived, move its row in `docs/ALL-SPRINTS.md` from `In progress` to `Done` (date = the change's creation date, summary in one line, archive folder name in the last column).

## Do not

- Create a new docs file. The set is fixed.
- Rewrite dated handoff notes or the history rows of `docs/ALL-SPRINTS.md` (they are history).
- Copy code into docs; point to paths and describe only what the code cannot say (rules, reasons, flows across files, gotchas).
- Document credentials, tokens, keys, private endpoints or values derived from `.env` (variable names only; placeholders such as `YOUR_API_KEY_HERE` in examples).

## Repository specifics (fe-mycourse)

Change to target file:

| Change | Target |
|--------|--------|
| Feature rule, flow, API call, screen behavior, permission of a feature | `docs/FEATURES.md`, the `## <slug>` entry of that feature (grep `^## `) |
| Route, layout, locale/proxy, screen barrel, global chrome, login/signup modal | `docs/PAGES.md` (the route table exists only there) |
| Reusable utility, hook, type, schema, store, constant, API caller, Server Action, component | `docs/SHARED.md` (one table row per asset) |
| Stack, directory map, conventions, environment variables, i18n, API layer, design decisions | `docs/ARCHITECTURE.md` |
| Deployment, Docker, quality gates, tests | `docs/deploy.md`, `docs/docker.md`, `docs/quality.md`, `docs/testing.md` |
| Work started / finished, new backlog item | `docs/ALL-SPRINTS.md` |

Feature slugs: `auth`, `home-and-catalog`, `seo-web`, `instructor-application`, `instructor-admin`, `taxonomy-admin`, `course-editor`, `course-review-admin`, `media`, `dashboards-and-access`, `realtime-streams`. A feature entry keeps the template `Summary`, `Rules`, `Flow`, `API`, `Screens/Routes`, `Code`, `Permissions`, `Related`, `Gotchas`; keep `Related:` slugs valid.
