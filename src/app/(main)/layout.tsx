"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { SidebarProvider } from "@/src/context/SidebarContext";
import Sidebar from "@/src/components/dashboard/Sidebar";
import Header from "@/src/components/dashboard/Header";
import { LoaderCircle } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const { user, token, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !token) {
			router.replace("/login");
		}
	}, [isLoading, token, router]);

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
				<div className='flex h-screen overflow-hidden bg-background-light'>
					<Sidebar />

					{/* <!-- ===== Content Area Start ===== --> */}
					<div className='relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden'>
						{/* <!-- ===== Header Start ===== --> */}
						<Header />
						{/* <!-- ===== Header End ===== --> */}

						{/* <!-- ===== Main Content Start ===== --> */}
						<main>
							<div className='mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'>
								{children}
							</div>
						</main>
						{/* <!-- ===== Main Content End ===== --> */}
					</div>
					{/* <!-- ===== Content Area End ===== --> */}
				</div>
			</SidebarProvider>
		);
	}

	return null;
}
