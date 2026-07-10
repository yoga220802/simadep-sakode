import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<main className='min-h-screen bg-background-light px-6 py-10'>
			<section className='mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center gap-8 text-center'>
				<Image
					src='/brand/simadep-sakode-logo-exact.svg'
					alt='Logo SIMADEP'
					width={420}
					height={140}
					priority
				/>
				<div className='max-w-2xl space-y-4'>
					<h1 className='text-4xl font-extrabold text-text-main sm:text-5xl'>
						SIMADEP
					</h1>
					<p className='text-lg font-semibold text-[var(--simadep-muted)] sm:text-xl'>
						Sistem Manajemen Departemen
					</p>
					<p className='text-base text-[var(--simadep-muted)] sm:text-lg'>
						Kelola proyek, tugas, pegawai, dan kolaborasi departemen dalam satu
						ruang kerja.
					</p>
				</div>
				<Link
					href='/login'
					className='inline-flex h-12 items-center justify-center rounded-lg bg-[var(--color-primary)] px-6 text-base font-bold text-[var(--simadep-foreground)] transition-opacity hover:opacity-90'>
					Masuk ke SIMADEP
				</Link>
			</section>
		</main>
	);
}
