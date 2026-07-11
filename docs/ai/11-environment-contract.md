# 11 - Environment Contract

## Server Variables

```env
NODE_ENV=development
APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-secret-minimum-32-chars
DATABASE_URL=mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev
OUTBOX_CRON_SECRET=replace-with-a-long-random-cron-secret-minimum-32-chars

STORAGE_PROVIDER=local # local | cloudinary
LOCAL_STORAGE_ROOT=.local/uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_CLUSTER=ap1
NEXT_PUBLIC_PUSHER_APP_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
NEXT_PUBLIC_PUSHER_TLS=true

FCM_PROJECT_ID=
FCM_ACCESS_TOKEN=
```

## Rules

- Only variables prefixed `NEXT_PUBLIC_` may enter the client bundle.
- Never expose Pusher secret, FCM access token, database URL, Better Auth secret, cron secret, or storage secrets.
- Parse env at startup with Zod in `src/infrastructure/env/server.ts`.
- Optional adapters must be disabled cleanly when credentials are empty.
- `STORAGE_PROVIDER` is always the switch. `LOCAL_STORAGE_ROOT` is only used when the provider is `local`; keep it for local development even when staging/production uses Cloudinary.
- `STORAGE_PROVIDER=cloudinary` requires all Cloudinary variables and fails closed when any credential is missing.
- Production runtime must provide `DATABASE_URL` and `BETTER_AUTH_SECRET`.
- Staging/production cron should provide `OUTBOX_CRON_SECRET`.
- `.env.local` and real credentials are gitignored.

Provider setup details are documented in `docs/generated/provider-setup-guide.md`.

## Local Seed Credentials

`npm run db:seed` creates local Better Auth credential accounts for smoke testing.

```text
password: SimadepLocal2026!
```

The seed users are documented in `docs/generated/release-preparation-prompt-13.md`.

## Codex Cloud Environment

Codex cloud only needs package installation and dummy non-secret values to run lint, typecheck, unit tests, and build. Do not store real database or provider secrets in repository or agent instructions.
