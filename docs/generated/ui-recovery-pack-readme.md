# SIMADEP UI/UX Recovery Pack

Paket ini digunakan setelah 14 fase implementasi backend SIMADEP selesai, tetapi UI/UX mengalami regresi besar dibanding frontend asli.

## Prinsip pemulihan

- Repository hasil Codex adalah sumber kebenaran untuk backend, database, authentication, authorization, server actions, events, dan tests.
- Repository original adalah sumber kebenaran untuk visual hierarchy, interaction pattern, tabs, modal, drawer, popover, filtering, dan progressive disclosure.
- Jangan me-revert backend baru.
- Jangan menyalin kembali service bearer-token atau `AuthContext` lama.
- Restore UI satu area per pull request.

## Urutan eksekusi

1. Baca `01-ui-ux-regression-audit.md`.
2. Jalankan `prompts/14-ui-parity-freeze-and-spec.md`.
3. Jalankan `prompts/15-project-ui-restoration.md`.
4. Review project list dan project detail secara manual.
5. Jalankan `prompts/16-role-ui-and-secondary-pages.md`.
6. Jalankan `prompts/17-visual-regression-and-cleanup.md`.

## Outcome

Target akhir bukan kembali ke arsitektur lama. Targetnya adalah UI lama yang familiar, tetapi menggunakan server queries, Server Actions, Drizzle, Better Auth, dan authorization baru.
