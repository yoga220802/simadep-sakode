# ADR 0002 - Drizzle Schema With Better Auth Boundary

Date: 2026-07-10

## Status

Accepted

## Context

Prompt 03 requires the SIMADEP MySQL/Drizzle foundation while explicitly
deferring Better Auth installation. The database spec says Better Auth should
own credential/session/account/verification tables, but SIMADEP domain tables
need stable references to users for profiles, memberships, audit logs,
notifications, and project/task authorship.

## Decision

The initial Drizzle schema does not create Better Auth tables manually. Domain
tables store user references as `varchar(36)` logical user ids without foreign
keys to the future Better Auth `user` table.

When Better Auth is installed, its generated/auth-owned schema will remain the
source of truth for auth tables. A follow-up migration may add explicit foreign
keys from SIMADEP domain tables to the auth user table only if the generated
table name, id column type, and migration workflow are confirmed.

## Consequences

- Prompt 03 can generate migrations and compile schema without installing
  Better Auth.
- Seed data can create bootstrap profile and membership rows for deterministic
  local development.
- Referential integrity for auth users is deferred and must be enforced by the
  Better Auth integration phase.
