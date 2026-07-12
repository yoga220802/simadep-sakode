# 15 — Owner Manual Checklist

Tasks that remain the repository owner's responsibility:

## Before Codex

- push frontend repo to a new branch;
- include backend FastAPI source under `legacy/backend-fastapi/` or provide a separate readable reference repository;
- copy this pack into repo;
- ensure no secrets are committed;
- decide npm vs pnpm; default current repo is npm.

## Database local

```bash
docker compose -f docker-compose.dev.yml up -d mysql
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run test:integration
```

Review every generated migration before apply.

## Codex cloud settings

- connect only intended GitHub repository;
- use setup command to install dependencies;
- no production secrets;
- internet access limited to dependency domains when required;
- use separate branch/worktree per phase.

## Manual visual review

- login page at desktop/mobile;
- logo at 16, 32, 160, and full width;
- sidebar collapsed/expanded;
- dark/light background if supported;
- all old SMIP wording removed.

## Security review

- verify cross-department access returns forbidden/not found;
- verify viewer cannot mutate;
- verify project owner protection;
- verify last admin protection;
- verify upload MIME/size policy;
- verify realtime channel auth;
- verify cron/outbox route secret.

## Production

- create separate dev/prod MySQL databases and users;
- configure Better Auth secret/URL;
- configure storage/realtime/push credentials;
- apply migration in controlled release;
- run smoke test;
- retain backup/rollback plan.
