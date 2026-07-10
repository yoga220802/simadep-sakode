# ADR 0001 - Feature-Driven Architecture Scaffold

Date: 2026-07-10

## Status

Accepted

## Context

The current application still contains legacy Next.js folders such as `src/components`, `src/services`, `src/context`, and `src/types`. Prompt 02 requires the target feature-driven boundaries to exist without bulk-moving every project/task component or rewriting behavior.

## Decision

Add the target folders beside the legacy structure:

- `src/features` for vertical slices and public feature APIs.
- `src/infrastructure` for server-only adapters.
- `src/shared` for generic primitives.
- `src/test` for cross-feature test support.

For now, legacy folders remain valid compatibility zones. New feature code must use public `index.ts` exports and should not deep-import another feature's internals.

Infrastructure modules import the local `server-only` boundary helper. A repository architecture test scans client components and fails if they import `src/infrastructure`, `server-only`, or future database modules.

## Consequences

- Existing pages keep building while future slices can migrate vertically.
- Only generic UI primitives may move to `src/shared`; domain-specific components stay in their current owners until their feature slice is migrated.
- The scaffold intentionally does not install Drizzle, Better Auth, or database adapters.
