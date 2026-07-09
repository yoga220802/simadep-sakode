# 16 — Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Big-bang AI rewrite | broad regressions | one phase/vertical slice per PR |
| Legacy rule missed | authorization/data bug | inspect route + service + policy + UI caller |
| Codex claims DB tests passed | false confidence | separate unit and integration commands/reports |
| Production credential exposed | security incident | no real secret in repo/Codex task |
| Better Auth schema drift | auth failure | generate/review adapter schema and test migration |
| User ID type mismatch | broken FK/migration | string IDs everywhere, explicit legacy mapping |
| Cross-department leakage | critical security | scoped repository queries + denied-path tests |
| Owner/admin orphan | lockout | protected transfer/demotion policies |
| Realtime treated as truth | stale/inconsistent UI | DB refetch after minimal event |
| Network call inside transaction | latency/failure | transactional outbox |
| File delete inconsistency | orphan file/row | storage lifecycle state and retry |
| Component refactor changes UX | user regression | baseline screenshots and incremental migration |
| Base64 logo retained | poor asset quality | native SVG acceptance criteria |
| Migration SQL destructive | data loss | manual review, backup, staging rehearsal |
| Concurrent edits overwrite | lost update | entity version/optimistic conflict |
