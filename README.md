# SIMADEP - Sistem Manajemen Departemen

SIMADEP adalah aplikasi Next.js full-stack untuk mengelola departemen, pegawai, proyek, tugas, kolaborasi, notifikasi, laporan, dan riwayat aktivitas.

Repository ini memakai frontend Next.js lama sebagai basis migrasi, sementara backend FastAPI lama hanya menjadi referensi perilaku dan aturan bisnis. Implementasi target ditulis ulang dalam TypeScript secara bertahap.

## Baseline Stack

- Next.js App Router
- TypeScript strict mode
- HeroUI + Tailwind CSS 4
- Nunito melalui Next font optimization
- Pusher untuk realtime foreground
- MySQL 8, Drizzle ORM, Better Auth, Zod, dan transactional outbox direncanakan untuk fase berikutnya

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

Salin `.env.example` ke `.env.local`, lalu sesuaikan:

```bash
NEXT_PUBLIC_API_SIMADEP_BASE_URL=http://localhost:3000/api
```

## Catatan Migrasi

- Jangan gunakan database production untuk pengembangan.
- Jangan menulis credential production ke repository.
- Drizzle dan Better Auth belum dipasang pada fase rebrand ini.
- Perubahan backend dan refactor feature-driven dilakukan pada prompt berikutnya.
