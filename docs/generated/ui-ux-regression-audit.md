# SIMADEP UI/UX Regression Audit

## 1. Executive conclusion

Implementasi backend hasil Codex secara struktural jauh lebih matang daripada repository original: Next.js full-stack, Drizzle, Better Auth, feature modules, policies, server actions, audit, outbox, notification, storage adapters, dan testing sudah tersedia.

Namun UI tidak dimigrasikan; UI **ditulis ulang secara sederhana**. Hal ini mengubah interaction model utama dari progressive disclosure menjadi form-heavy dashboard. Akibatnya fitur masih ada secara teknis, tetapi cara pengguna mengaksesnya berbeda drastis dan membingungkan.

Keputusan yang tepat sekarang adalah **UI parity restoration**, bukan backend rewrite kedua.

## 2. Quantitative comparison

Perbandingan area project:

| Metric | Original | Codex result |
|---|---:|---:|
| Related UI files | 31 | 10 |
| Related UI LOC | sekitar 5.848 | sekitar 1.745 |
| Form inline | hampir tidak ada pada page utama; form berada di modal/popover | sekitar 27 penggunaan form/action-form |
| Modal symbol usage | 18 | 0 |
| Drawer usage | 3 | 0 |
| Popover usage | 12 | 0 |
| Tabs usage | 3 | 0 |

Angka menunjukkan bahwa kompleksitas UI bukan dipindahkan ke feature-driven modules, melainkan dipangkas dan diganti dengan raw form inline.

Secara keseluruhan repository:

- Original: 83 file TypeScript/TSX di `src`.
- Codex: 176 file TypeScript/TSX di `src` karena backend dan tests bertambah.
- Tetapi puluhan komponen UI original dihapus, termasuk project card, project tabs, project modal, member modal, task modal, task drawer, assignment popovers, category modal, filter controls, dan dashboard helpers.

## 3. Critical regression: project detail

### Original behavior

`src/app/(main)/projects/[id]/page.tsx` original:

- menyimpan `activeTab`;
- hanya merender satu bagian aktif;
- tab: Detail, Daftar Tugas, Kategori, Laporan;
- tab Laporan hanya tersedia bagi role tertentu;
- task detail dibuka melalui drawer;
- create/edit/delete dilakukan melalui modal/popover.

### Codex behavior

`src/app/(main)/projects/[id]/page.tsx` hasil Codex:

- mengambil project detail;
- mengambil seluruh work items;
- mengambil collaboration seluruh task;
- mengambil report;
- mengambil seluruh assignable users;
- lalu merender semuanya dalam satu halaman.

Urutan render saat ini:

1. header;
2. tiga stat cards;
3. form edit metadata;
4. form dan tabel member;
5. seluruh milestone, kategori, task, subtask, komentar, attachment;
6. seluruh report.

Ini bukan adaptasi UI original. Ini adalah admin/debug surface yang menampilkan semua kemampuan sekaligus.

## 4. Critical regression: actions no longer use progressive disclosure

### Original

- Buat/edit project: modal.
- Hapus project: confirmation modal.
- Edit jadwal: modal.
- Kelola member: modal.
- Buat/edit task: modal.
- Detail task: right drawer.
- Assign member/category: popover.
- Comment/attachment: task drawer.
- Category create/edit: modal.

### Codex result

- Create project form selalu tampil di project list.
- Project edit form selalu tampil di project detail.
- Member add/edit/remove selalu tampil.
- Category create/edit/delete tampil bersama tasks.
- Milestone edit form selalu tampil.
- Setiap task menampilkan status form, edit form, assign form, delete button, subtask form, comment form, dan attachment form.

Pengguna dipaksa memahami seluruh operasi sekaligus, bahkan ketika tujuan mereka hanya melihat detail atau memperbarui satu status.

## 5. UI permission regressions

Backend policy baru cukup baik, tetapi UI sering menampilkan kontrol yang akan ditolak server.

### 5.1 Project edit and member controls

Project detail selalu merender `ProjectEditForm` dan `ProjectMembersPanel`, tanpa memeriksa capability actor pada UI.

Dampak:

- contributor/viewer melihat form edit;
- mereka dapat mengisi dan submit, lalu baru menerima error;
- halaman memuat daftar assignable users untuk semua actor.

### 5.2 Assignable users query

`listAssignableProjectUsers()` tidak menerima actor atau project dan mengembalikan seluruh user aktif. Project detail memanggilnya sebelum menentukan bahwa actor boleh mengelola member.

Ini bukan hanya masalah tampilan; ini berpotensi membuka direktori user kepada actor yang hanya memiliki read access project.

### 5.3 Category and milestone controls

Pada `ProjectWorkItemsPanel`:

- update category form dirender walaupun `canManage` false;
- update milestone form dirender walaupun `canManage` false;
- hanya beberapa delete/create controls yang disembunyikan.

### 5.4 Task controls

Pada setiap `TaskCard`:

- status-change form ditampilkan kepada semua viewer;
- edit/assign/delete form bergantung satu boolean `canManage`;
- tidak ada capability granular per task;
- task collaboration panel selalu menampilkan comment/upload/delete controls, walaupun hak actor bisa berbeda.

### 5.5 Report visibility

Original hanya menampilkan tab Laporan untuk Admin dan Project Manager. Implementasi baru memanggil `getProjectReportForActor`, yang hanya memvalidasi visibility project, lalu report selalu dirender. Dengan demikian viewer project dapat melihat report jika bisa melihat project.

Apakah ini diinginkan harus diputuskan produk. Karena user meminta parity UI/role, default pemulihan adalah membatasi report berdasarkan capability eksplisit.

## 6. Role-navigation mismatch

`session-client.ts` memetakan:

- `super_admin/admin` → `Admin`;
- semua role global lain → `Team Member`.

Akibatnya UI tidak pernah benar-benar memiliki display role `Project Manager` atau `Viewer`. Padahal role baru bersifat contextual pada department/project.

Solusi bukan menghidupkan kembali mapping role legacy. Solusinya adalah membuat navigation dan controls berdasarkan **capabilities dan memberships**, bukan satu display role global.

## 7. Project list regression

### Original

- role-aware status filter tabs dengan counts;
- year filter;
- create button membuka modal;
- project cards dengan status, date range, total tasks;
- edit/delete dropdown pada card;
- delete confirmation modal;
- create/edit share modal yang sama.

### Codex result

- raw text/select filter form;
- summary berubah menjadi lima stat boxes;
- create form tampil penuh di halaman;
- card disederhanakan menjadi Link;
- edit/delete action pada card hilang;
- modal dan confirmation flow hilang.

Backend query dan URL filters baru dapat dipertahankan, tetapi presentasi harus kembali ke interaction pattern original.

## 8. Task UX regression

Original task page/project task view membedakan:

- overview milestone/task list;
- filters;
- task row compact;
- task detail drawer;
- form create/edit modal;
- assignment/category popover;
- delete confirmation.

Codex result menaruh semua metadata dan form edit dalam setiap card. Ini menyebabkan:

- halaman panjang secara ekstrem;
- sulit melakukan scanning;
- risiko accidental action meningkat;
- task detail tidak memiliki focus context;
- comments dan attachments berulang untuk setiap task;
- collaboration seluruh project diambil saat page load.

## 9. Performance regression

Original project detail memuat project base, lalu child view aktif mengambil data yang diperlukan. Codex project detail memuat empat domain besar sekaligus:

- project/member;
- work items;
- collaboration untuk seluruh tasks;
- reporting.

Selain UX, hal ini meningkatkan query volume dan render size. Report dan collaboration seharusnya lazy berdasarkan active tab/selected task.

## 10. What must be preserved from Codex result

Jangan revert:

- Better Auth;
- Drizzle schema/migrations;
- database repositories/use cases;
- domain policies;
- server actions;
- transactions;
- audit log;
- outbox and notifications;
- storage adapters;
- tests;
- feature-driven module boundaries.

UI restoration harus memanggil server query/action yang sudah ada atau menambahkan query/action kecil yang diperlukan.

## 11. Target recovery architecture

### Project detail route

Gunakan URL-driven tabs:

```text
/projects/:id?tab=detail
/projects/:id?tab=tasks
/projects/:id?tab=categories
/projects/:id?tab=report
```

Server page selalu memuat:

- session;
- actor;
- base project detail;
- capability object.

Kemudian hanya memuat data tab aktif:

- detail: metadata + member summary;
- tasks: milestones/tasks/categories minimal;
- categories: category list;
- report: report query;
- collaboration: hanya saat task drawer dibuka.

### Capability contract

Tambahkan capability yang eksplisit pada DTO:

```ts
permissions: {
  canEditProject: boolean;
  canArchiveProject: boolean;
  canManageMembers: boolean;
  canViewTasks: boolean;
  canManageTasks: boolean;
  canManageCategories: boolean;
  canViewReport: boolean;
}
```

Per task:

```ts
permissions: {
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canChangeStatus: boolean;
  canComment: boolean;
  canAttach: boolean;
}
```

Backend tetap menjadi final enforcement; capability hanya mengarahkan UX.

### Modal and drawer adapters

Client components dapat tetap menggunakan Server Actions:

- `<form action={serverAction}>` di dalam HeroUI Modal;
- `useActionState` untuk result/loading;
- `router.refresh()` atau revalidation setelah sukses;
- modal close setelah success;
- confirmation modal sebelum destructive action.

Feature-driven architecture tidak melarang modal, tabs, drawer, popover, atau client state.

## 12. Priority classification

### P0 — restore before further feature work

1. Project detail tabs.
2. Hide unauthorized project/member/work-item actions.
3. Restrict assignable user query.
4. Lazy-load report and collaboration.
5. Restore task detail drawer.
6. Restore create/edit/delete confirmations.

### P1

1. Restore project list cards/filter tabs/modal.
2. Separate category tab.
3. Restore task create/edit modal and assign popovers.
4. Restore role/capability-aware navigation.

### P2

1. Dashboard visual parity.
2. Users create modal/filter/table polish.
3. Departments interaction refinement.
4. Visual regression screenshots and accessibility polish.

## 13. Final recommendation

Do not execute another broad “improve UI” prompt. That risks another redesign. Use original UI as a read-only interaction specification and restore one route at a time, beginning with project list and project detail.
