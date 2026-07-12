# SIMADEP - Sistem Manajemen Departemen

SIMADEP adalah aplikasi Next.js full-stack untuk mengelola departemen, pegawai, proyek, tugas, kolaborasi, notifikasi, laporan, dan riwayat aktivitas.

Repository ini adalah aplikasi Next.js full-stack. Backend FastAPI lama hanya menjadi referensi perilaku dan aturan bisnis; runtime pengembangan dan build tidak memerlukan FastAPI.

## Baseline Stack

- Next.js App Router
- TypeScript strict mode
- HeroUI + Tailwind CSS 4
- Nunito melalui Next font optimization
- Better Auth untuk session dan autentikasi
- MySQL 8 + Drizzle ORM
- Zod untuk validasi boundary
- Transactional outbox, Pusher realtime foreground, dan FCM push adapter opsional

## Development

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run check
```

Database lokal:

```bash
npm run db:migrate
npm run db:seed
$env:RUN_DB_TESTS='1'; npm run test:integration
```

Visual regression lokal:

```bash
npx playwright install chromium
npm run test:e2e
```

Output screenshot, trace, dan report disimpan sebagai artifact lokal di `test-results` dan `playwright-report`.

## Environment

Salin `.env.example` ke `.env.local`, lalu sesuaikan minimal:

```bash
DATABASE_URL=mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev
APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-local-secret
OUTBOX_CRON_SECRET=replace-with-a-long-random-local-cron-secret
```

Panduan lengkap untuk Pusher, FCM, Cloudinary, device token, dan outbox cron ada di `docs/generated/provider-setup-guide.md`.

## Akun Seed Lokal

`npm run db:seed` membuat akun Better Auth untuk smoke test lokal/staging.
Semua akun seed memakai password:

```text
simadep@sakode
```

| Kebutuhan | Email | Department Role | Project Role |
| --- | --- | --- | --- |
| Super admin | `myadmin.simadep@sakode.com` | `member` | none |
| Global admin | `global.admin.local@simadep.test` | `member` | none |
| User biasa | `user.local@simadep.test` | `member` | none |
| Department head | `head.local@simadep.test` | `head` | none |
| Department admin | `dept.admin.local@simadep.test` | `department_admin` | none |
| Department member | `dept.member.local@simadep.test` | `member` | none |
| Department viewer | `dept.viewer.local@simadep.test` | `viewer` | none |
| Project owner | `owner.local@simadep.test` | `member` | `owner` |
| Project manager | `manager.local@simadep.test` | `member` | `manager` |
| Project contributor | `contributor.local@simadep.test` | `member` | `contributor` |
| Project viewer | `viewer.local@simadep.test` | `member` | `viewer` |

Seed ini membuat satu departemen utama: `SIMADEP Department`, dan satu project
utama: `SIMADEP Role Workflow`.

Jangan gunakan credential seed ini untuk production.

## Release Checks

- Liveness: `GET /api/health`
- Readiness: `GET /api/health?ready=1`
- Protected outbox processing: `POST /api/jobs/outbox/process` with either admin session or `Authorization: Bearer $OUTBOX_CRON_SECRET`
- Release checklist, legacy import mapping, backup/rollback/cutover plan, and known limitations: `docs/generated/release-preparation-prompt-13.md`

## Catatan Migrasi

- Jangan gunakan database production untuk pengembangan.
- Jangan menulis credential production ke repository.
- FastAPI tidak diperlukan untuk menjalankan dashboard, user management, department, project, task, collaboration, notification, report, dan audit flow yang sudah dimigrasikan.
- Provider eksternal seperti Pusher, FCM, dan Cloudinary aman dikosongkan untuk development lokal; adapter realtime/push berjalan disabled, dan storage bisa memakai mode local.
