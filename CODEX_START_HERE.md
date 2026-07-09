# Codex Start Here

## Misi

Refactor repository frontend SMIP menjadi **SIMADEP**, sebuah aplikasi Next.js full-stack yang menyatukan UI dan backend application layer dalam satu codebase. Pertahankan alur pengguna dan business behaviour yang masih relevan dari frontend serta backend FastAPI lama.

## Jangan melakukan big-bang rewrite

Kerjakan roadmap melalui pull request kecil. Jangan mencoba menyelesaikan autentikasi, database, seluruh fitur proyek, realtime, dan rebranding dalam satu task.

## Operating mode tanpa database remote

Codex harus berasumsi bahwa:

- tidak ada `DATABASE_URL` remote yang dapat digunakan;
- tidak boleh meminta credential production;
- database integration test mungkin tidak tersedia pada cloud task;
- schema dan migration generation tetap harus dapat dijalankan tanpa database hidup;
- unit test menggunakan fake repository atau in-memory adapter;
- database integration test diberi tag dan dijalankan di MySQL lokal atau CI;
- jika MySQL tidak tersedia, Codex harus melaporkan bahwa DB integration test belum dijalankan, bukan mengklaim lulus.

## Perintah baseline target

Setelah foundation selesai, repository harus menyediakan perintah berikut:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:unit
npm run test:integration
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
npm run check
```

`npm run check` minimal menjalankan lint, typecheck, unit test, dan build. Integration test boleh dipisahkan karena membutuhkan MySQL.

## Output wajib setiap task

Codex harus memperbarui `implementation-report.md` yang berisi:

- objective dan scope;
- legacy files yang diperiksa;
- keputusan yang diambil;
- file yang berubah;
- migration/schema changes;
- test yang dijalankan dan hasilnya;
- test yang tidak dapat dijalankan;
- risiko dan pekerjaan lanjutan;
- acceptance criteria checklist.
