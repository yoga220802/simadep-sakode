# Database Infrastructure

This folder owns the Drizzle/MySQL boundary for SIMADEP.

The schema includes the Better Auth tables (`user`, `session`, `account`, and
`verification`) plus SIMADEP-owned domain tables. Better Auth remains
responsible for credential/session semantics, while SIMADEP owns profile,
membership, audit, and business authorization data.

Local development uses:

```text
DATABASE_URL=mysql://simadep:simadep@127.0.0.1:3306/simadep
```

Use `docker compose up -d mysql` for a local MySQL 8 database, then run
`npm run db:migrate`, `npm run db:seed`, and optionally
`npm run auth:bootstrap-admin` with local bootstrap env values.
