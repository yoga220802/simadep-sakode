# 11 — Environment Contract

## Server variables

```env
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=mysql://simadep:simadep@127.0.0.1:3306/simadep
BETTER_AUTH_SECRET=replace-with-long-random-string
BETTER_AUTH_URL=http://localhost:3000

PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap1
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=ap1

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

STORAGE_DRIVER=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CRON_SECRET=replace-local-only
LOG_LEVEL=debug
```

## Rules

- Only variables prefixed `NEXT_PUBLIC_` may enter client bundle.
- Never expose Pusher secret, Firebase private key, DB URL, Better Auth secret, or storage secret.
- Parse env at startup with Zod.
- Optional adapters must be disabled cleanly when credentials are empty.
- Production deployment must fail fast for required secrets.
- `.env.local` and credentials are gitignored.

## Codex cloud environment

Codex cloud only needs package installation and dummy non-secret values to run lint/typecheck/build. Do not store real database or provider secrets in repository or agent instructions.
