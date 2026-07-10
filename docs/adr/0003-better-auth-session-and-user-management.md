# ADR 0003 - Better Auth Session And User Management

Date: 2026-07-10

## Status

Accepted

## Context

SIMADEP is replacing the legacy bearer-token authentication flow with Better
Auth sessions backed by MySQL and Drizzle. Prompt 04 covers authentication and
internal user management only; departments and projects remain out of scope.

## Decision

Use Better Auth with the official Drizzle adapter, MySQL provider, email and
password authentication, and the admin plugin. The auth route is mounted at
`/api/auth/[...all]`.

The Better Auth tables are represented in the Drizzle schema so migrations stay
schema-first with the rest of SIMADEP. SIMADEP-specific user data remains in
`user_profiles`, keyed by the Better Auth user id.

Global roles are `super_admin`, `admin`, and `user`. Better Auth's admin access
control maps both `super_admin` and `admin` to admin permissions, while SIMADEP
use cases enforce product-specific invariants such as self-demotion and
last-active-admin protection.

The legacy `AuthContext` remains as a compatibility wrapper for existing client
components, but login/logout/session resolution now use Better Auth. Custom
`auth_token` cookie storage is removed.

## Consequences

- New auth work should use server session helpers and Better Auth APIs.
- Existing project/task client code can be migrated progressively without a
  broad feature refactor in Prompt 04.
- Production runtime still requires real `BETTER_AUTH_SECRET` and
  `DATABASE_URL`; local/CI build can compile with non-secret fallback values.
