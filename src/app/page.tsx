import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SIMADEP - Sistem Manajemen Departemen",
  description:
    "SIMADEP adalah sistem manajemen departemen milik SAKODE Academy untuk mengelola pegawai, proyek, tugas, kolaborasi, laporan, dan aktivitas.",
};

const featureItems = [
  {
    title: "Departemen dan Pegawai",
    description:
      "Kelola struktur departemen, role anggota, dan akses pengguna dengan kontrol admin yang jelas.",
    icon: Building2,
  },
  {
    title: "Proyek dan Tugas",
    description:
      "Pantau proyek, milestone, kategori, assignee, status, dan progres kerja lintas tim.",
    icon: FolderKanban,
  },
  {
    title: "Kolaborasi Terkendali",
    description:
      "Komentar, lampiran, notifikasi, dan audit aktivitas tersimpan rapi sesuai konteks pekerjaan.",
    icon: Bell,
  },
];

const workflowItems = [
  "Dashboard ringkas untuk membaca kondisi pekerjaan",
  "Filter proyek dan tugas yang langsung diterapkan",
  "Tampilan list, kanban, dan gantt untuk alur kerja berbeda",
  "Kontrol akses berbasis role global, departemen, dan proyek",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--simadep-background)] text-[var(--color-text-main)]">
      <header className="sticky top-0 z-30 border-b border-[var(--simadep-border)] bg-white/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="SIMADEP" className="relative h-12 w-44">
            <Image
              src="/brand/simadep-sakode-logo-exact.svg"
              alt="Logo SIMADEP Sakode"
              fill
              priority
              className="object-contain object-left"
            />
          </Link>
          <nav aria-label="Navigasi utama" className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-extrabold text-[var(--simadep-foreground)] hover:opacity-90"
            >
              Masuk Sistem
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[var(--simadep-border)] bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.92fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-lg bg-[var(--simadep-primary-soft)] px-4 py-2 text-sm font-extrabold text-[var(--simadep-foreground)]">
              Sistem Manajemen Departemen
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-[var(--color-text-main)] sm:text-5xl lg:text-6xl">
              SIMADEP
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[var(--simadep-muted)]">
              Satu ruang kerja untuk mengelola departemen, pegawai, proyek,
              tugas, kolaborasi, laporan, dan riwayat aktivitas dengan alur
              yang lebih tertata.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 text-base font-extrabold text-[var(--simadep-foreground)] hover:opacity-90"
              >
                Masuk ke SIMADEP
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#kapabilitas"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--simadep-border)] px-6 text-base font-bold hover:bg-[var(--simadep-primary-soft)]"
              >
                Lihat Kapabilitas
              </a>
            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden rounded-lg border border-[var(--simadep-border)] bg-[var(--simadep-background)] shadow-sm">
            <div className="flex h-14 items-center justify-between border-b border-[var(--simadep-border)] bg-white px-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[var(--color-secondary)]" />
                <span className="h-3 w-3 rounded-full bg-[var(--color-primary)]" />
                <span className="h-3 w-3 rounded-full bg-[var(--color-accent)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--simadep-muted)]">
                Dashboard
              </span>
            </div>
            <div className="grid gap-4 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ["Pegawai", "128", UsersRound],
                  ["Proyek Aktif", "24", FolderKanban],
                  ["Tugas Selesai", "312", CheckCircle2],
                ].map(([label, value, Icon]) => (
                  <div
                    key={label as string}
                    className="rounded-lg border border-[var(--simadep-border)] bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--simadep-muted)]">
                        {label as string}
                      </p>
                      <Icon className="h-5 w-5 text-[var(--color-accent)]" />
                    </div>
                    <p className="mt-4 text-3xl font-extrabold">
                      {value as string}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-[var(--simadep-border)] bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-extrabold">Progres Departemen</p>
                  <Activity className="h-5 w-5 text-[var(--color-secondary)]" />
                </div>
                <div className="space-y-4">
                  {[
                    ["Pengembangan Portal", "82%", "var(--color-primary)"],
                    ["Validasi Data", "64%", "var(--color-accent)"],
                    ["Dokumentasi", "48%", "var(--color-secondary)"],
                  ].map(([label, value, color]) => (
                    <div key={label as string}>
                      <div className="mb-2 flex justify-between text-sm font-bold">
                        <span>{label as string}</span>
                        <span>{value as string}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: value as string,
                            background: color as string,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--simadep-border)] bg-white p-4">
                  <p className="mb-3 flex items-center gap-2 font-extrabold">
                    <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />
                    Tugas Hari Ini
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--simadep-muted)]">
                    <li>Review milestone proyek</li>
                    <li>Validasi assignee prioritas</li>
                    <li>Sinkronisasi laporan departemen</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-[var(--simadep-border)] bg-white p-4">
                  <p className="mb-3 flex items-center gap-2 font-extrabold">
                    <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
                    Akses Aman
                  </p>
                  <p className="text-sm leading-6 text-[var(--simadep-muted)]">
                    Visibilitas dan aksi mengikuti role sistem, departemen, dan
                    proyek.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--simadep-border)] bg-[var(--simadep-background)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[0.75fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-extrabold uppercase text-[var(--color-secondary)]">
              Pemilik Sistem
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">SAKODE Academy</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--simadep-muted)]">
              SIMADEP merupakan sistem manajemen departemen dari SAKODE
              Academy. Sistem ini membantu operasional departemen berjalan
              lebih terukur, transparan, dan mudah dipantau.
            </p>
            <a
              href="https://sakode.com"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--simadep-border)] px-4 text-sm font-extrabold hover:bg-[var(--simadep-primary-soft)]"
            >
              Kunjungi sakode.com
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="rounded-lg border border-[var(--simadep-border)] bg-white p-6 shadow-sm">
            <Image
              src="/brand/sakode-academy-logo.png"
              alt="Logo SAKODE Academy"
              width={533}
              height={167}
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section id="kapabilitas" className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-extrabold">Kapabilitas Utama</h2>
          <p className="mt-3 text-base leading-7 text-[var(--simadep-muted)]">
            SIMADEP dirancang untuk pekerjaan operasional yang perlu dilihat,
            dikoordinasikan, dan diaudit secara konsisten.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featureItems.map((item) => (
            <article
              key={item.title}
              className="rounded-lg border border-[var(--simadep-border)] bg-white p-5 shadow-sm"
            >
              <item.icon className="h-7 w-7 text-[var(--color-accent)]" />
              <h3 className="mt-4 text-lg font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--simadep-muted)]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--simadep-border)] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[0.85fr_1fr]">
          <div>
            <p className="text-sm font-extrabold uppercase text-[var(--color-secondary)]">
              Cara Kerja
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">
              Interaksi singkat, keputusan lebih cepat.
            </h2>
          </div>
          <div className="grid gap-3">
            {workflowItems.map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-lg border border-[var(--simadep-border)] bg-[var(--simadep-background)] p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-extrabold text-[var(--simadep-foreground)]">
                  {index + 1}
                </span>
                <p className="pt-1 font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-lg border border-[var(--simadep-border)] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold">Siap masuk ke sistem?</h2>
            <p className="mt-2 text-sm text-[var(--simadep-muted)]">
              Gunakan akun SIMADEP yang sudah dibuat oleh admin.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 text-base font-extrabold text-[var(--simadep-foreground)] hover:opacity-90"
          >
            Login Sekarang
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
