"use client";

import { useParams } from "next/navigation";

export default function ProjectDetailPage() {
	const params = useParams();
	const { id } = params;

	return (
		<div>
			<h1 className='text-3xl font-bold'>Detail Proyek #{id}</h1>
			<p className='mt-4'>
				Halaman ini akan menampilkan semua detail, tugas, dan anggota dari proyek.
				Fitur ini sedang dalam pengembangan.
			</p>
		</div>
	);
}
