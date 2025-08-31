import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GlobalNotFound() {
	return (
		<main className='flex items-center justify-center min-h-screen bg-background-light'>
			<div className='text-center p-8'>
				<Image
					src='/not-found.svg'
					alt='Halaman Tidak Ditemukan'
					width={400}
					height={300}
					className='mb-8 mx-auto'
				/>
				<h1 className='text-4xl font-bold text-text-main mb-2'>
					Oops! Halaman Tidak Ditemukan
				</h1>
				<p className='text-lg text-gray-500 mb-8 max-w-md mx-auto'>
					Sepertinya Anda tersesat. Halaman yang Anda cari tidak ada atau sudah
					dipindahkan.
				</p>
				<Link
					href='/login'
					className='inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity'>
					<ArrowLeft size={20} />
					Kembali ke Halaman Yang Valid
				</Link>
			</div>
		</main>
	);
}
