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

## Environment

Salin `.env.example` ke `.env.local`, lalu sesuaikan minimal:

```bash
DATABASE_URL=mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev
APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-local-secret
OUTBOX_CRON_SECRET=replace-with-a-long-random-local-cron-secret
```

## Akun Seed Lokal

`npm run db:seed` membuat akun Better Auth untuk smoke test lokal/staging.
Semua akun seed memakai password:

```text
SimadepLocal2026!
```

| Kebutuhan | Email |
| --- | --- |
| Super admin | `admin.local@simadep.test` |
| Global admin | `global.admin.local@simadep.test` |
| User biasa | `user.local@simadep.test` |
| Department head / project owner | `head.local@simadep.test` |
| Department admin | `dept.admin.local@simadep.test` |
| Department member | `dept.member.local@simadep.test` |
| Department viewer | `dept.viewer.local@simadep.test` |
| Project manager | `manager.local@simadep.test` |
| Project contributor | `contributor.local@simadep.test` |
| Project viewer | `viewer.local@simadep.test` |

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
- Provider eksternal seperti Pusher, FCM, dan Cloudinary aman dikosongkan untuk development lokal; adapter akan berjalan dalam mode disabled/skeleton sesuai fase migrasi.
