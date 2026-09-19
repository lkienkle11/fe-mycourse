## Context

`DashboardLayout` (`src/components/common/dashboard/dashboard-layout.tsx:200` to `213`) renders its denial state as:

```tsx
<HeaderDashboard trailing={<DashboardHeaderLocale />} />
<StatusErrorPage variant={me ? "forbidden" : "unauthorized"} fillViewport />
```

versus the authorized state:

```tsx
<HeaderDashboard
  leading={<DashboardMenuTrigger />}
  trailing={<DashboardHeaderLocale />}
/>
```

`HeaderDashboard` (`src/components/common/header/header-dashboard.tsx:18` to `44`) renders `{leading}` next to its own logo and title button, and that button is `hidden md:flex`, visible only at `md` and above. Below `md`, the header's left slot is whatever `leading` provides, nothing else. `DashboardMenuTrigger` (`dashboard-layout.tsx:73` to `90`) calls `useSidebar()`, which requires a `SidebarProvider` ancestor; the denial branch does not render one (there is no sidebar to open when access is denied), so `DashboardMenuTrigger` cannot be reused there as-is.

The repo already has a logo-only, no-title mobile link pattern: `HeaderMobileBar` (`src/components/common/header/header-mobile-bar.tsx:23` to `25`):

```tsx
<Link href={homeHref} className="flex items-center select-none">
  <MainLogo />
</Link>
```

See proposal.md for why this needs fixing.

## Goals / Non-Goals

**Goals:**
- Below `md`, the denial branch's header shows the MyCourse logo (no title) where the authorized branch shows the menu trigger, so the header is never an empty corner on mobile.
- Reuse the existing logo-only link pattern rather than introducing a new visual treatment.

**Non-Goals:**
- Not changing `HeaderDashboard`'s own logo and title button, its `md+` behavior is already correct in both states.
- Not changing the authorized branch, `DashboardMenuTrigger` keeps its current behavior and visibility.
- Not touching `error.tsx`, `global-error.tsx`, or any `StatusErrorPage` usage inside an already-authorized page (e.g. `editor-page.tsx`), confirmed out of scope during exploration.
- Not adding a `SidebarProvider` to the denial branch. There is deliberately no sidebar to open there.

## Decisions

**New leading element: shared `BrandLogoLink` component, `md:hidden` at the call site, no `SidebarProvider` dependency.** Extracted `BrandLogoLink` (`src/components/common/header/brand-logo-link.tsx`, exported from `header/index.ts`) rendering `<Link href={homeHref} className={cn("flex items-center select-none", className)}><MainLogo /></Link>`, and use it in both `HeaderMobileBar` (`header-mobile-bar.tsx`, no extra `className`) and `DashboardLayout`'s denial branch (`leading={<BrandLogoLink className="md:hidden" />}`). Revised after initial implementation added a second, near-identical inline copy of this exact markup as a `dashboard-layout.tsx`-local `DashboardDeniedMobileBrand` component: the user flagged the duplication directly, per this repo's Critical Deduplication Rule (AGENTS.md) duplicated logic must be merged into a shared implementation rather than left as two copies, so the "extract later, not now" call below was wrong the moment a second call site existed, not just hypothetically. The two call sites' difference (mobile-only marketing header row vs. one `leading` slot in a dashboard shell) is fully absorbed by the optional `className` prop, no speculative abstraction needed to accommodate it.

**Visibility via `md:hidden` on the link itself, not by branch-only logic.** `HeaderDashboard`'s own logo button is already `md+`-only; making the new denial-branch logo `md:hidden` on the same element keeps the "exactly one logo visible per breakpoint" invariant explicit in markup rather than relying on the branch split alone. At `md+`, both `leading` (hidden) and `HeaderDashboard`'s own button (visible) exist in the DOM without visual conflict, same pattern the authorized branch already relies on for `DashboardMenuTrigger` (`md:hidden` on the trigger itself).

**No change to `HeaderDashboard`.** Its `leading` prop already accepts arbitrary content; the fix is entirely caller-side in `DashboardLayout`. Alternative considered: give `HeaderDashboard` a new prop like `showDefaultMobileLogo` to fill the gap internally when `leading` is omitted, rejected, it would make `HeaderDashboard` decide UI that depends on why `leading` is empty (denied vs. simply not needed), a decision that belongs to the caller that knows the reason, not to the shared header shell.

## Risks / Trade-offs

- [The `dashboard-access-control` capability this delta modifies is not yet archived into `openspec/specs/` (`unify-dashboard-forbidden-ui` is complete but unarchived), so this change's spec delta is written against the requirement text as merged in code today rather than an archived base file] → Accepted: flagged in proposal.md's Impact section; if `unify-dashboard-forbidden-ui` archives first, this delta applies normally against the resulting base spec, if this change lands first, the archive step needs to reconcile both changes' deltas for the same requirement (both touch "Denial state keeps the visitor able to recover").
- [A future change to the layout's desktop breakpoint (`md`) in one of the two places, `HeaderDashboard`'s own button or the new denial-branch logo, without updating the other, silently reintroduces either a double-logo or an empty-corner state] → Accepted: both use the same Tailwind `md` breakpoint token already used throughout this file (`DashboardMenuTrigger` also keys off `md:hidden`), consistent with the existing convention; no new breakpoint is introduced.
