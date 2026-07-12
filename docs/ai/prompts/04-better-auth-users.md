# Prompt 04 — Better Auth and Internal User Management

Tasks:

1. Integrate Better Auth with Drizzle/MySQL following official adapter patterns already captured in project dependencies.
2. Implement auth route and server session helpers.
3. Replace custom bearer-token AuthContext progressively.
4. Implement `user_profiles` and admin user management use cases.
5. Implement global role, ban/unban, session revoke, last-admin protection, and audit events.
6. Add bootstrap admin process that uses env/local seed—not hardcoded production credentials.
7. Migrate login page to Better Auth while preserving SIMADEP branding.
8. Add unit tests and DB integration tests. Run DB tests only if MySQL exists.
9. Do not implement departments/projects in this phase.
