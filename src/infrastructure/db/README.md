# Database Infrastructure

This folder owns the Drizzle/MySQL boundary for SIMADEP.

The schema intentionally excludes Better Auth managed tables (`user`, `session`,
`account`, and `verification`). SIMADEP domain tables keep logical user id
columns until the Better Auth integration phase wires those references through
the generated auth schema.

Local development uses:

```text
DATABASE_URL=mysql://simadep:simadep@127.0.0.1:3306/simadep
```

Use `docker compose up -d mysql` for a local MySQL 8 database, then run
`npm run db:migrate` and `npm run db:seed`.
