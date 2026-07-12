# AGENTS.md — SIMADEP

Instruksi ini wajib dipatuhi seluruh Codex thread yang bekerja pada repository SIMADEP.

## 1. Product mission

Bangun ulang frontend SMIP Next.js menjadi **SIMADEP — Sistem Manajemen Departemen**, satu aplikasi Next.js full-stack. Backend FastAPI lama adalah behavioural reference. Business rule yang masih relevan harus dipertahankan, tetapi implementasinya ditulis ulang dalam TypeScript.

## 2. Source of truth

Ketika terdapat konflik, gunakan urutan berikut:

1. `docs/ai/17-PRD.md`
2. `docs/ai/07-domain-rules-and-permission-matrix.md`
3. `docs/ai/04-backend-technical-spec.md`
4. `docs/ai/05-database-schema-and-drizzle.md`
5. `docs/ai/03-target-feature-driven-architecture.md`
6. `docs/ai/06-auth-user-management-authorization.md`
7. `docs/ai/08-events-realtime-notifications.md`
8. kode dan test legacy yang sudah diperiksa
9. asumsi agent

Jangan mengubah requirement atau arsitektur secara diam-diam. Catat keputusan baru dalam ADR.

## 3. Codex database constraint

- Jangan mengakses database production.
- Jangan meminta atau menulis credential production.
- Jangan menganggap database remote tersedia.
- Gunakan schema-first development, generated migration, fake repository, dan unit test.
- Database integration test dijalankan menggunakan MySQL lokal atau CI service container.
- Jangan menandai integration test sebagai passed jika tidak dijalankan.
- Jangan menggunakan `drizzle-kit push` untuk workflow production.
- Jangan mengubah migration yang sudah pernah diterapkan; buat migration baru.

## 4. Architecture rules

Struktur utama:

```text
src/
├── app/                 # route dan composition root
├── features/            # business vertical slices
├── infrastructure/      # db, auth, storage, realtime, jobs
├── shared/              # generic primitives
└── test/                # fixture/helper lintas fitur
```

Aturan:

- `src/app` tidak berisi business logic.
- React component tidak boleh mengakses Drizzle atau database.
- Route Handler dan Server Action hanya adapter: authenticate, validate, authorize, invoke use case, normalize result.
- Domain/application layer tidak boleh mengimpor Next.js, React, HeroUI, Pusher, Firebase, atau driver database.
- Import fitur lain hanya melalui public API `index.ts`.
- Jangan membuat folder berdasarkan layer global seperti `services/`, `repositories/`, dan `types/` untuk semua domain.
- Jangan membuat satu file lebih dari 300 baris tanpa alasan yang dicatat.
- Jangan memindahkan file hanya demi tampilan struktur; pindahkan bersama responsibility dan tests.

## 5. Server rules

- Server Components untuk initial read jika cocok.
- Server Actions untuk mutation internal web.
- Route Handlers untuk Better Auth, webhook, upload, realtime auth, health check, dan API eksternal.
- Jangan melakukan server-side `fetch` ke endpoint aplikasi sendiri.
- Tambahkan `server-only` pada modul backend.
- Semua input divalidasi dengan Zod pada boundary.
- Semua write melakukan authorization di server.
- Semua read membatasi scope berdasarkan role/membership.
- Jangan percaya `userId`, role, departmentId, projectId, atau ownerId yang dikirim client tanpa verifikasi.

## 6. Authentication and authorization

- Better Auth mengelola credential, account, verification, session, ban, dan operasi admin yang sesuai.
- Profile kepegawaian dan membership dikelola SIMADEP.
- Global role: `super_admin`, `admin`, `user`.
- Department role: `head`, `department_admin`, `member`, `viewer`.
- Project role: `owner`, `manager`, `contributor`, `viewer`.
- Authorization bukan hanya role check; gunakan contextual policy.
- Admin tidak boleh menurunkan role admin terakhir.
- User tidak boleh mengubah role global dirinya sendiri.
- User lintas departemen tidak boleh membaca project tanpa hak eksplisit.

## 7. Database rules

- MySQL 8, UTC, `datetime(3)`.
- Drizzle schema dibagi per domain ownership.
- ID aplikasi berupa string UUID; legacy integer disimpan pada `legacy_id` nullable unique selama migrasi.
- Semua foreign key, unique constraint, index, dan delete rule eksplisit.
- Gunakan transaction untuk multi-write.
- Perubahan state, audit log, notification, dan outbox event disimpan pada transaction yang sama jika satu business action.
- Gunakan optimistic version pada entity yang sering diedit bersamaan, minimal project dan task.
- Soft delete hanya untuk resource yang memang perlu dipulihkan/audit; jangan menerapkannya ke semua tabel.

## 8. Events and realtime

- Database adalah source of truth.
- Pusher/Ably hanya invalidation/signal channel.
- FCM hanya push background.
- Jangan melakukan network call dari MySQL trigger.
- Gunakan transactional outbox.
- Event handler harus idempotent.
- Realtime payload tidak membawa data sensitif atau keseluruhan entity.

## 9. UI and rebranding

Brand:

- name: `SIMADEP`
- full name: `Sistem Manajemen Departemen`
- primary: `#71CFFE`
- secondary: `#F9723B`
- accent: `#BC71FE`
- font: Nunito

Logo lama berupa raster base64 di dalam SVG harus diganti native SVG. Buat full wordmark, compact mark, dan favicon. Update semua metadata, alt text, title, README, environment names, dan visible copy.

## 10. Quality gates

Untuk setiap task, jalankan yang tersedia:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run db:generate
```

Jika MySQL tersedia:

```bash
npm run db:migrate
npm run db:seed
npm run test:integration
```

Tidak boleh menyatakan selesai bila command gagal karena perubahan yang dibuat. Existing failure harus dibedakan dari introduced failure.

## 11. Working method

1. Baca prompt fase aktif.
2. Inspect file legacy terkait.
3. Buat plan di `implementation-report.md`.
4. Kerjakan scope sekecil mungkin.
5. Tambahkan test.
6. Jalankan quality gates.
7. Perbarui dokumentasi dan report.
8. Berikan summary diff, commands, result, risk, dan next phase.
