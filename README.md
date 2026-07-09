# SIMADEP Codex-Ready Implementation Pack

Paket ini disiapkan untuk membangun ulang **SIMADEP — Sistem Manajemen Departemen** dengan menjadikan repository frontend Next.js lama sebagai basis utama, sementara backend FastAPI lama digunakan sebagai referensi perilaku dan aturan bisnis.

Paket ini sengaja dirancang agar Codex **tidak memerlukan akses langsung ke database remote atau production**. Codex harus mampu mengerjakan schema, migration, seed, business logic, UI, unit test, dan build hanya dari isi repository. Pengujian yang benar-benar membutuhkan MySQL dijalankan melalui MySQL lokal atau GitHub Actions service container.

## Target stack

- Next.js App Router full-stack
- TypeScript strict mode
- Feature-Driven Architecture / vertical slice modular monolith
- MySQL 8
- Drizzle ORM + Drizzle Kit
- Better Auth
- Zod
- HeroUI + Tailwind CSS 4
- Nunito
- Pusher untuk realtime foreground
- FCM opsional untuk background push notification
- Transactional outbox untuk event delivery

## Cara memasang ke repository

1. Salin `AGENTS.md` ke root repository frontend.
2. Salin folder `docs/` ke root repository; isinya sudah berada pada `docs/ai/`.
3. Prompt sudah tersedia di `docs/ai/prompts/`.
4. Salin file yang diperlukan dari `templates/` ke repo, tetapi review dahulu nama path dan package manager.
5. Commit seluruh dokumen sebelum menghubungkan repository ke Codex.
6. Jalankan prompt secara berurutan, satu fase per thread atau pull request.

## Urutan baca untuk Codex

1. `AGENTS.md`
2. `CODEX_START_HERE.md`
3. `docs/ai/01-codex-operating-model.md`
4. `docs/ai/02-legacy-refactor-map.md`
5. `docs/ai/03-target-feature-driven-architecture.md`
6. `docs/ai/04-backend-technical-spec.md`
7. `docs/ai/05-database-schema-and-drizzle.md`
8. `docs/ai/06-auth-user-management-authorization.md`
9. `docs/ai/07-domain-rules-and-permission-matrix.md`
10. `docs/ai/08-events-realtime-notifications.md`
11. `docs/ai/09-server-contracts.md`
12. `docs/ai/10-testing-without-direct-db.md`
13. `docs/ai/11-environment-contract.md`
14. `docs/ai/12-rebranding-and-logo.md`
15. `docs/ai/13-migration-roadmap.md`
16. `docs/ai/14-definition-of-done.md`
17. `docs/ai/15-owner-manual-checklist.md`
18. `docs/ai/16-risk-register.md`
19. `docs/ai/17-PRD.md`

## Prinsip utama

- Codex tidak boleh diberi credential production.
- Backend FastAPI tidak ditempel ke Next.js; perilakunya ditulis ulang dalam TypeScript.
- Frontend lama dipertahankan secara selektif, bukan dibuang seluruhnya.
- Setiap perubahan dikerjakan sebagai vertical slice yang dapat direview.
- Satu prompt harus menghasilkan satu scope perubahan yang jelas dan testable.
- Migration SQL selalu direview manusia sebelum diterapkan.
- Tidak ada fase yang dianggap selesai hanya karena build berhasil; authorization dan data isolation wajib diuji.
