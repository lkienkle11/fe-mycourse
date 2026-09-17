## Purpose

Defines the frontend's accepted role value for bulk collaborator additions while retaining the distinct roles returned for course ownership and membership display.

## ADDED Requirements

### Requirement: Bulk collaborator addition represents only assignable roles
The frontend bulk-add request contract SHALL permit `EDITOR` as the optional role value and SHALL not represent `OWNER` as assignable through this request.

#### Scenario: Add collaborators with an explicit role
- **WHEN** a frontend caller constructs a bulk collaborator addition request with a role
- **THEN** the request contract permits `EDITOR` and excludes `OWNER`

#### Scenario: Add collaborators without a role
- **WHEN** a frontend caller omits the optional role from a bulk collaborator addition request
- **THEN** the request contract remains valid and relies on the backend's `EDITOR` default

### Requirement: Response roles remain distinct from assignable request roles
The frontend course collaborator response contract SHALL continue to represent both `OWNER` and `EDITOR` for course and collaborator display.

#### Scenario: Display a canonical course owner
- **WHEN** a course response identifies a collaborator as `OWNER`
- **THEN** the frontend contract preserves that role for display even though bulk-add requests cannot assign it
