# 01 — Codex Operating Model

## Tujuan

Memberikan cara kerja yang realistis ketika repository dikerjakan Codex cloud atau Codex local tanpa bergantung pada akses database remote.

## Mode yang direkomendasikan

### Codex cloud

Gunakan untuk:

- audit codebase;
- refactor struktur;
- pembuatan schema Drizzle;
- migration generation;
- business logic dan unit test;
- UI refactor;
- documentation;
- lint, typecheck, build;
- pull request per fase.

Jangan bergantung pada:

- akses MySQL production;
- credential Aiven/managed DB;
- Pusher/FCM real credential;
- upload provider real credential.

### Codex local/app

Gunakan ketika perlu:

- menjalankan MySQL dari Docker lokal;
- menguji migration;
- integration test;
- browser testing terhadap aplikasi lokal;
- meninjau screenshot hasil rebranding.

### GitHub Actions

Gunakan sebagai validator independen untuk:

- install reproducibility;
- lint/typecheck/build;
- unit test;
- MySQL integration test menggunakan service container;
- migration apply dari database kosong;
- seed smoke test.

## Secrets policy

Tidak ada secret nyata di repository. Gunakan placeholder pada `.env.example`. Credential production hanya dimasukkan manusia ke platform deployment. Test harus memakai value lokal atau dummy.

## Task sizing

Satu thread idealnya menangani satu capability atau satu infrastructure concern. Hindari dua thread mengubah schema atau barrel export yang sama. Gunakan worktree/branch terpisah.

## Review checkpoints

Setiap PR harus direview pada:

1. perubahan architecture boundary;
2. migration SQL;
3. authorization scope;
4. transaction boundary;
5. delete/cascade behaviour;
6. event recipient;
7. client/server import leakage;
8. output test.
