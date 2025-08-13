"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

export default function Header() {
	const pathname = usePathname();

	// Fungsi untuk mengubah path menjadi judul yang lebih mudah dibaca
	const getTitleFromPath = (path: string) => {
		if (path === "/dashboard") return "Dashboard";
		const title = path.replace("/", "").replace("-", " ");
		return title.charAt(0).toUpperCase() + title.slice(1);
	};

	return (
		<header className='bg-white border-b border-gray-200 p-4 sticky top-0 z-10'>
			<div className='flex items-center justify-between'>
				{/* Judul Halaman */}
				<h1 className='text-xl font-bold text-text-main'>
					{getTitleFromPath(pathname)}
				</h1>

				{/* Search dan Notifikasi */}
				<div className='flex items-center gap-4'>
					<div className='relative hidden md:block'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
						<input
							type='text'
							placeholder='Search anything...'
							className='pl-10 pr-4 py-2 w-64 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary'
						/>
					</div>
					<button className='relative p-2 rounded-full hover:bg-gray-100' title='Notifications'>
						<Bell className='w-6 h-6 text-gray-600' />
						<span className='absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white'></span>
					</button>
				</div>
			</div>
		</header>
	);
}
