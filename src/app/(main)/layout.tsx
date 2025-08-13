"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import Sidebar from "@/src/components/dashboard/Sidebar";
import Header from "@/src/components/dashboard/Header";
import { LoaderCircle } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const { user, token, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// Jika loading selesai dan tidak ada token/user, tendang ke halaman login.
		if (!isLoading && !token) {
			router.replace("/login");
		}
	}, [isLoading, token, router]);

	// Selama loading, tampilkan spinner di tengah layar.
	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-screen bg-gray-100'>
				<LoaderCircle className='w-12 h-12 animate-spin text-primary' />
			</div>
		);
	}

	// Jika sudah login, tampilkan layout aplikasi.
	// Pastikan user tidak null untuk menghindari error render.
	if (user) {
		return (
			<div className='flex h-screen bg-background-light'>
				<Sidebar />
				<div className='flex-1 flex flex-col overflow-hidden'>
					<Header />
					<main className='flex-1 overflow-x-hidden overflow-y-auto bg-background-light p-6 md:p-8'>
						{children}
					</main>
				</div>
			</div>
		);
	}

	// Fallback jika terjadi kondisi yang tidak diharapkan.
	return null;
}
