# Session summary — remove POST /instructors (single add) (2026-06-25)

## Change

Dropped legacy `POST /api/v1/instructors` client (`addInstructorRosterService`, `AddRosterPayload`). Roster add is bulk-only via `POST /api/v1/instructors/bulk`.

## Quality gates

- `npm run check-all`: PASS
