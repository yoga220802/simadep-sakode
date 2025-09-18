"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react"; // Import useRef
import { useAuth } from "@/src/context/AuthContext";
import { SidebarProvider } from "@/src/context/SidebarContext";
import Sidebar from "@/src/components/dashboard/Sidebar";
import Header from "@/src/components/dashboard/Header";
import { LoaderCircle } from "lucide-react";
import { notificationService } from "@/src/services/notificationService";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const { user, token, isLoading } = useAuth();
	const router = useRouter();
	const notificationInitialized = useRef(false); // Flag untuk penanda inisialisasi

	useEffect(() => {
		if (!isLoading && !token) {
			router.replace("/login");
		}

		// Inisialisasi service notifikasi saat user sudah terautentikasi
		// dan pastikan hanya dijalankan sekali
		if (user && token && !notificationInitialized.current) {
			// FIX: Kirim seluruh objek `user`, bukan cuma `user.id`
			notificationService.initialize(token, user);
			notificationInitialized.current = true; // Tandai sudah diinisialisasi
		}

		// Cleanup saat komponen unmount atau user logout
		return () => {
			// Cek flag sebelum disconnect, ini akan dijalankan saat user logout
			if (notificationInitialized.current) {
				notificationService.disconnect();
				notificationInitialized.current = false; // Reset flag saat logout
			}
		};
	}, [isLoading, token, router, user]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-screen bg-gray-100'>
				<LoaderCircle className='w-12 h-12 animate-spin text-primary' />
			</div>
		);
	}

	if (user) {
		return (
			<SidebarProvider>
				<div className='flex flex-col h-screen overflow-hidden bg-background-light'>
					<Header />
					<div className='flex flex-1 overflow-hidden'>
						<Sidebar />
						<main className='flex-1 overflow-y-auto overflow-x-hidden'>
							<div className='mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'>
								{children}
							</div>
						</main>
					</div>
				</div>
			</SidebarProvider>
		);
	}

	return null;
}
