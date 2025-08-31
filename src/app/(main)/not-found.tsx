import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
	return (
		<div className='flex flex-col items-center justify-center h-full pt-16'>
			<div className='text-center'>
				<Image
					src='/not-found.svg'
					alt='Halaman Tidak Ditemukan'
					width={400}
					height={300}
					className='mb-8'
				/>
				<h1 className='text-4xl font-bold text-text-main mb-2'>
					Halaman Tidak Ditemukan
				</h1>
				<p className='text-lg text-gray-500 mb-8 max-w-md mx-auto'>
					Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin halaman
					tersebut telah dihapus atau Anda salah memasukkan URL.
				</p>
				<Link
					href='/dashboard'
					className='inline-flex items-center gap-2 bg-[var(--color-primary)] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity'>
					<ArrowLeft size={20} />
					Kembali ke Dashboard
				</Link>
			</div>
		</div>
	);
}
