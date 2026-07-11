# SIMADEP Provider Setup Guide

Panduan ini menjelaskan cara menyiapkan provider eksternal untuk development, staging, atau production. Jangan commit credential asli ke repository. Isi credential di `.env.local`, dashboard hosting, atau secret manager.

## Ringkasan Arsitektur

SIMADEP memakai tiga jalur provider:

- **Pusher Channels** untuk realtime foreground. Contoh: drawer detail tugas otomatis refresh saat komentar/lampiran berubah.
- **FCM** untuk push notification background. Contoh: user menerima push saat tidak sedang membuka halaman.
- **Cloudinary** untuk penyimpanan attachment file. Link attachment tetap disimpan sebagai metadata URL di database.

Semua event bisnis tetap ditulis ke database lebih dulu. Aksi komentar, attachment, task, dan project menulis audit log, notification inbox, dan outbox event dalam transaksi yang sama. Provider eksternal dipanggil oleh outbox processor, bukan langsung dari transaksi bisnis.

## Environment Minimal Lokal

```env
DATABASE_URL=mysql://simadep_app:SimadepLocal2026_App@127.0.0.1:3306/simadep_dev
APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-long-random-local-secret
OUTBOX_CRON_SECRET=replace-with-a-long-random-local-cron-secret

STORAGE_PROVIDER=local
LOCAL_STORAGE_ROOT=.local/uploads
```

Dengan konfigurasi ini, Pusher, FCM, dan Cloudinary boleh kosong. Aplikasi tetap bisa berjalan; realtime/push disabled, upload memakai local storage.

## Pusher Channels

### Membuat App Pusher

1. Buka dashboard Pusher.
2. Buat app baru untuk SIMADEP, misalnya `simadep-dev` atau `simadep-staging`.
3. Pilih cluster terdekat, misalnya `ap1`.
4. Aktifkan Channels.
5. Ambil nilai dari halaman **App Keys**:
   - `app_id`
   - `key`
   - `secret`
   - `cluster`

### Isi Environment

```env
NEXT_PUBLIC_PUSHER_APP_KEY=isi_dari_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
NEXT_PUBLIC_PUSHER_TLS=true

PUSHER_APP_ID=isi_dari_app_id
PUSHER_APP_KEY=isi_dari_key
PUSHER_APP_SECRET=isi_dari_secret
PUSHER_CLUSTER=ap1
```

`NEXT_PUBLIC_PUSHER_APP_KEY` dan `NEXT_PUBLIC_PUSHER_CLUSTER` dipakai browser untuk subscribe channel. `PUSHER_APP_SECRET` hanya server-side untuk signing dan publish event.

### Channel yang Dipakai

- `private-user-{userId}` untuk notification inbox user.
- `private-project-{projectId}` untuk invalidation project/task/collaboration.
- `private-department-{departmentId}` untuk invalidation department.

Private channel auth ada di:

```text
POST /api/realtime/auth
```

Endpoint ini memakai session Better Auth dan mengecek permission/membership sebelum menandatangani channel.

## FCM

### Membuat Firebase Project

1. Buka Firebase Console.
2. Buat project, misalnya `simadep-dev`.
3. Aktifkan Cloud Messaging.
4. Catat **Project ID**.
5. Buat Web App jika nanti ingin registrasi token dari browser.
6. Ambil Web Push certificate/VAPID key bila service worker push browser akan diaktifkan di fase UI berikutnya.

### Credential Server Saat Ini

Adapter SIMADEP saat ini memakai FCM HTTP v1 dengan OAuth access token singkat.

```env
FCM_PROJECT_ID=simadep-dev
FCM_ACCESS_TOKEN=ya29.generated_oauth_access_token
```

Untuk development, access token bisa dibuat dari Google Cloud CLI dengan service account yang punya akses Firebase Cloud Messaging:

```bash
gcloud auth application-default print-access-token
```

Untuk staging/production, jangan isi token manual jangka panjang. Buat proses rotasi token atau upgrade adapter ke service-account based token generation di secret manager/runtime. Selama `FCM_PROJECT_ID` atau `FCM_ACCESS_TOKEN` kosong, adapter FCM disabled dan tidak menggagalkan transaksi bisnis.

### Device Token

SIMADEP sudah menyediakan endpoint registrasi token:

```text
POST /api/notifications/device-tokens
```

Body:

```json
{
  "token": "fcm-device-token",
  "deviceName": "Chrome Windows"
}
```

Token disimpan di tabel `device_tokens`. Jika FCM mengembalikan token invalid/unregistered, outbox processor akan revoke token tersebut.

## Cloudinary

### Membuat Cloudinary App

1. Buka dashboard Cloudinary.
2. Gunakan cloud khusus environment, misalnya `simadep-dev` atau folder khusus `simadep`.
3. Ambil nilai:
   - Cloud name
   - API key
   - API secret

### Isi Environment

Untuk local filesystem:

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_ROOT=.local/uploads
```

Untuk Cloudinary:

```env
STORAGE_PROVIDER=cloudinary
LOCAL_STORAGE_ROOT=.local/uploads
CLOUDINARY_CLOUD_NAME=isi_cloud_name
CLOUDINARY_API_KEY=isi_api_key
CLOUDINARY_API_SECRET=isi_api_secret
```

`LOCAL_STORAGE_ROOT` tidak dipakai saat `STORAGE_PROVIDER=cloudinary`, tetapi tetap disarankan ada di `.env.example` sebagai fallback development/test. Di environment deployed yang hanya memakai Cloudinary, variabel itu boleh dibiarkan default atau tidak diisi jika schema runtime sudah memberi default.

### Cara Upload Bekerja

Adapter Cloudinary memakai signed upload HTTP:

- endpoint upload: `/auto/upload`
- folder: `tasks/{taskId}`
- `storageKey`: `{resource_type}/{public_id}`
- URL publik disimpan sebagai `externalUrl`
- checksum SHA-256 tetap dihitung lokal untuk audit/integrity

Delete memakai endpoint `{resource_type}/destroy` dengan `invalidate=true`.

Jika upload Cloudinary berhasil tetapi insert database gagal, SIMADEP mencoba cleanup storage. Jika cleanup gagal, cleanup request masuk outbox agar bisa dicoba lagi.

## Outbox Processor

Provider eksternal tidak dipanggil dari transaksi bisnis. Jalankan outbox processor secara periodik:

```text
POST /api/jobs/outbox/process
Authorization: Bearer $OUTBOX_CRON_SECRET
```

Contoh lokal:

```bash
curl -X POST http://localhost:3000/api/jobs/outbox/process \
  -H "Authorization: Bearer replace-with-a-long-random-local-cron-secret"
```

Rekomendasi jadwal:

- development: manual saat ingin mengetes Pusher/FCM;
- staging: setiap 30-60 detik;
- production: setiap 15-30 detik atau worker terpisah.

Outbox memiliki retry exponential backoff dan dead-letter setelah batas attempt. Provider outage tidak membatalkan aksi user yang sudah committed di database.

## Checklist Verifikasi

1. Jalankan aplikasi dan login.
2. Pastikan `.env.local` berisi `NEXT_PUBLIC_PUSHER_*` dan `PUSHER_*`.
3. Buka project yang sama di dua browser/user berbeda.
4. Tambah komentar di drawer detail tugas.
5. Jalankan outbox processor.
6. Browser lain harus menerima event Pusher dan refresh komentar/lampiran.
7. Jika device token FCM terdaftar dan `FCM_*` valid, user lain menerima push background.
8. Uji upload file:
   - `STORAGE_PROVIDER=local`: file masuk ke `.local/uploads`.
   - `STORAGE_PROVIDER=cloudinary`: file muncul di Cloudinary dan URL tersimpan sebagai attachment.

## Troubleshooting

- **Realtime disabled**: cek `NEXT_PUBLIC_PUSHER_APP_KEY`, `PUSHER_APP_KEY`, dan `PUSHER_APP_SECRET`.
- **Private channel auth 403/404**: user tidak punya akses ke project/department tersebut.
- **Tidak ada update realtime setelah komentar**: pastikan outbox processor dijalankan; event tidak dikirim otomatis tanpa worker/cron.
- **FCM tidak terkirim**: cek `FCM_ACCESS_TOKEN` masih valid dan device token belum revoked.
- **Cloudinary upload gagal credential incomplete**: pastikan `STORAGE_PROVIDER=cloudinary` hanya dipakai jika tiga credential Cloudinary lengkap.
- **LOCAL_STORAGE_ROOT bingung dipakai atau tidak**: hanya dipakai provider `local`; aman tetap ada sebagai fallback.
