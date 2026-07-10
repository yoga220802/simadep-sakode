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

## Environment

Salin `.env.example` ke `.env.local`, lalu sesuaikan minimal:

```bash
DATABASE_URL=mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev
APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-local-secret
```

## Catatan Migrasi

- Jangan gunakan database production untuk pengembangan.
- Jangan menulis credential production ke repository.
- FastAPI tidak diperlukan untuk menjalankan dashboard, user management, department, project, task, collaboration, notification, report, dan audit flow yang sudah dimigrasikan.
- Provider eksternal seperti Pusher, FCM, dan Cloudinary aman dikosongkan untuk development lokal; adapter akan berjalan dalam mode disabled/skeleton sesuai fase migrasi.
