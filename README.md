<div align="center">

<h1>Sistem Manajemen dan Informasi Proyek (SMIP)</h1>
<p><strong>Aplikasi web modern untuk manajemen proyek dan kolaborasi tim yang dibangun dengan Next.js.</strong></p>

<p>
<a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
<a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
</p>

<p>
<img src="https://img.shields.io/badge/Web-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="Web">
</p>
</div>

---

Sistem **Manajemen dan Informasi Proyek (SMIP)** adalah aplikasi web frontend yang menyediakan platform kolaboratif bagi tim dalam mengelola proyek, tugas, dan komunikasi internal secara efisien. Dibangun dengan tumpukan teknologi modern, aplikasi ini dirancang untuk skalabilitas, kemudahan pemeliharaan, dan pengalaman pengguna yang responsif.

---

## 🌟 Fitur Unggulan

| Fitur                    | Deskripsi                                                                                                          | Ikon |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ---- |
| **Otentikasi & Peran**   | Sistem login aman dengan peran pengguna yang berbeda (Admin, PM, Member).                                          | 🔐   |
| **Dashboard Dinamis**    | Tampilan ringkasan proyek dan tugas yang menyesuaikan dengan peran pengguna.                                       | 📊   |
| **Manajemen Proyek**     | Fitur CRUD penuh untuk proyek, lengkap dengan filter status dan tahun.                                             | 🚀   |
| **Manajemen Tugas**      | Kelola tugas dengan struktur Milestones, Tugas, dan Sub-tugas. Termasuk penugasan, status, lampiran, dan komentar. | 📋   |
| **Notifikasi Real-time** | Menggunakan Pusher.js untuk memberikan notifikasi instan kepada pengguna terkait pembaruan.                        | 🔔   |
| **Manajemen Pengguna**   | Halaman khusus Admin untuk mengelola daftar pengguna dan peran mereka dalam sistem.                                | 👥   |
| **Pelaporan Proyek**     | Visualisasi data untuk memantau kemajuan proyek, kinerja tim, dan metrik penting lainnya.                          | 📈   |
| **UI/UX Modern**         | Antarmuka yang bersih dan interaktif menggunakan modal, popover, dan notifikasi toast.                             | ✨    |

---

## 📸 Galeri Aplikasi

<div align="center">
<img src="https://placehold.co/800x600/FFFFFF/333333?text=Halaman+Dashboard" alt="Halaman Dashboard" hspace="10" width="45%">
<img src="https://placehold.co/800x600/FFFFFF/333333?text=Halaman+Detail+Proyek" alt="Halaman Detail Proyek" hspace="10" width="45%">
<br><br>
<img src="https://placehold.co/800x600/FFFFFF/333333?text=Manajemen+Tugas" alt="Manajemen Tugas" hspace="10" width="45%">
<img src="https://placehold.co/800x600/FFFFFF/333333?text=Sidebar+Detail+Tugas" alt="Sidebar Detail Tugas" hspace="10" width="45%">
</div>

---

## 🎗️ Arsitektur & Tumpukan Teknologi

Proyek ini mengikuti arsitektur yang bersih, memisahkan UI, manajemen state, dan layanan data untuk skalabilitas dan kemudahan pemeliharaan.

* **Framework:** Next.js 15 (App Router)
* **Manajemen State:** React Context API
* **Jaringan:** Fetch API (dibungkus dalam services layer)
* **Real-time:** Pusher.js
* **Styling:** Tailwind CSS v4 & HeroUI

```
/src
├── app/                # Rute aplikasi (App Router)
│   ├── (auth)/         # Grup rute untuk autentikasi
│   └── (main)/         # Grup rute untuk halaman utama setelah login
├── components/         # Komponen-komponen React yang dapat digunakan kembali
├── config/             # Konfigurasi aplikasi (misal: dashboard)
├── context/            # React Context untuk manajemen state global
├── hooks/              # Custom React Hooks
├── providers/          # Penyedia konteks global
├── services/           # Logika untuk berinteraksi dengan API backend
└── types/              # Definisi tipe TypeScript
```

---

## 🚀 Memulai

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

### 1. Prasyarat

Pastikan Anda telah menginstal:

* Node.js (v18.18.0 atau lebih baru)
* npm (v7 atau lebih baru)

### 2. Clone Repositori

```bash
git clone https://github.com/username/nama-repositori.git
cd nama-repositori
```

### 3. Install Dependensi

```bash
npm install
```

### 4. Konfigurasi Environment Variables

Buat file `.env.local` di root direktori dan isi dengan variabel berikut:

```bash
# URL base dari API backend SMIP
NEXT_PUBLIC_API_SMIP_BASE_URL=http://your-api-domain.com

# Kredensial Pusher untuk notifikasi real-time
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
NEXT_PUBLIC_PUSHER_TLS=true
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🌐 Deployment di Vercel

1. Impor Proyek di **Vercel** dari repositori Git Anda.
2. Konfigurasi **Environment Variables** di pengaturan proyek sesuai dengan `.env.local`.
3. Deploy — Vercel akan otomatis melakukan build dan menayangkan aplikasi Anda.

---
