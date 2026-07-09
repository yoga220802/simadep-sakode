# Prompt 02 — Feature-Driven Architecture Scaffold

Create the target folder boundaries without migrating all business code at once.

Tasks:

1. Add `src/features`, `src/infrastructure`, `src/shared`, `src/test` structure.
2. Add public API `index.ts` convention and examples.
3. Add server-only boundary and import rules.
4. Move truly generic primitives such as pagination/toast helpers only when safe.
5. Add architecture documentation/ADR if current Next structure requires deviation.
6. Add an architecture test or ESLint restriction where practical to prevent client importing server-only/database modules.
7. Do not bulk move every project/task component.

Acceptance: existing pages still build; structure is ready for vertical migration.
