## MODIFIED Requirements

### Requirement: Denial state keeps the visitor able to recover
A rendered denial state SHALL leave the visitor able to act on it: the dashboard header and its authentication entry point SHALL remain visible alongside the denial state, and the denial state SHALL offer a way back to a part of the application the visitor can reach. On a narrow (mobile) viewport, where the header's section-specific navigation control (the menu trigger shown when access is granted) is not shown, the header SHALL instead show the application's brand mark (logo only, no title text) in that same position, so the header stays visibly identifiable rather than showing an empty corner.

#### Scenario: Denial state is shown to a visitor
- **WHEN** a denial state is rendered for any dashboard section
- **THEN** the dashboard header, including its login/signup entry point, remains visible, and the denial state includes an action that navigates the visitor to a reachable page

#### Scenario: Denial state is shown to a visitor on a mobile viewport
- **WHEN** a denial state is rendered for any dashboard section on a viewport narrower than the layout's desktop breakpoint
- **THEN** the header's leading position shows the application's logo only, with no title text, in place of the menu trigger shown in the authorized layout
