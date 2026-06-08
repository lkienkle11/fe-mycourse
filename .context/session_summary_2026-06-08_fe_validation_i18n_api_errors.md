# Session Summary: FE Validation, Required Labels, and Code-Based API Error i18n

_Date:_ 2026-06-08  
_Repo:_ `fe-mycourse`

## Scope

Implemented shared validation + API error infrastructure and migrated **Auth**, **Me API**, **Media**, **Taxonomy**, **Instructor**, and **Course** modules to:

- `errors.codes.{numericCode}` for all API failures (never show BE `message`)
- Module-scoped `*.validation.*` keys for Zod / pre-submit checks
- `RequiredLabel` + `FieldError` on key forms
- `ApiErrorCode` synced 1:1 with BE `errcode_codes.go`

## Shared infrastructure

| Asset | Path |
|-------|------|
| `ApiErrorCode` (full BE mirror) | `src/constants/api-error-code.ts` |
| `toastApiError`, `translateApiErrorCode`, `extractAxiosApiError` | `src/lib/utils/api-error.ts` |
| `errors.codes.*` copy (en/vi) | `src/messages/error-codes.ts` |
| `RequiredLabel`, `FieldError` | `src/components/shared/` |
| `resolveValidationMessage` | `src/lib/utils/validation-message.ts` |
| Zod schemas | `src/schema/{auth,me,media,taxonomy,instructor,course}/` |

## Module changes

- **Auth:** login/signup/confirm/logout/resend — code-based inline errors; removed `registerErrorKey` and login `result.message` leak.
- **Me API:** routes + callers for PATCH/DELETE/hard-delete/permissions; `useAuth.errorCode` for GET failures.
- **Media:** upload client validation → `media.validation.*`; API → `toastApiError`.
- **Taxonomy:** shared schemas, RequiredLabel, FieldError, `toastApiError` on create/update/delete.
- **Instructor:** roster/approvals/expertise/tickets/profiles — validation + `toastApiError`.
- **Course:** list create, editor saves, review approve/reject — validation + `toastApiError`.

## Quality

Passed: `npm run lint:biome`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run quality:deps`.

## Messages audit (2026-06-08 follow-up)

- `error-codes.ts`: all BE numeric codes present (taxonomy/course/instructor share `2xxx`/`3xxx`; media also `9010`–`9018`). Module pre-submit copy in `*.validation.*` namespaces.
- Fixed taxonomy form: `resolveValidationMessage` now uses `useTranslations("taxonomy.form")` (auth-style parent namespace).
- Removed unused duplicate taxonomy validation keys (`nameRequired`, `slugRequired`, …) from `en.ts`/`vi.ts`.

## Docs updated (full sync)

| Doc | Changes |
|-----|---------|
| `docs/api-using.md` | API error i18n section, Me API routes/callers, Do Not Use table |
| `docs/api-overview.md` | Me routes, error handling rules, audit date |
| `docs/reusable-assets.md` | toastApiError, RequiredLabel, FieldError, schemas, Me API services |
| `docs/modules.md` | Validation+i18n module, Me API section, cross-module contracts |
| `docs/patterns.md` | §6b API error pattern, validation namespace table, i18n two-namespace rule |
| `docs/taxonomy-admin.md` | Validation & API errors section |
| `docs/instructor-admin.md` | Validation & API errors section |
| `docs/media-collection.md` | `media.validation.*`, toastApiError, i18n table |
| `docs/logic-flow.md` | Form result.code, §8 API error display flow |
| `docs/flow.md` | Signup error mapping via errors.codes |
| `docs/architecture.md` | api-error.ts, schema/, Me callers, error envelope note |
| `docs/folder-structure.md` | schema tree, api-error.ts, error-codes.ts, messages namespaces |
| `docs/components.md` | RequiredLabel, FieldError, feature module error notes |
| `docs/dependencies.md` | Zod schema modules |
| `docs/pages.md` | Validation & API errors by screen table |
| `docs/screens.md` | Auth error flow, RequiredLabel/FieldError, i18n namespaces, Me API routes |
| `docs/router.md` | New-page checklist step for validation/API errors |
| `docs/quality.md` | 2026-06-08 baseline + api-error/schema refactor note |
| `docs/logic-flow.md` | Me `errorCode`, §8 API error display |
| `docs/flow.md` | Login error line + signup code-based errors |
| `docs/components.md` | Course feature components + validation note |

## GitNexus

- `detect_changes({ scope: "all" })` run at close-out
- `npx gitnexus analyze --force` refreshed index (2,471 nodes)
