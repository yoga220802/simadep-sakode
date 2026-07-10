"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionUser } from "@/src/features/identity/session-client";
import { SidebarProvider } from "@/src/context/SidebarContext";
import Sidebar from "@/src/components/dashboard/Sidebar";
import Header from "@/src/components/dashboard/Header";
import { LoaderCircle } from "lucide-react";

// THIS COMPONENT IS NOW CLEAN AND ONLY RESPONSIBLE FOR LAYOUT
export default function AppLayout({ children }: { children: React.ReactNode }) {
	const { user, isPending } = useSessionUser();
	const router = useRouter();

	useEffect(() => {
		// Redirect logic remains the same
		if (!isPending && !user) {
			router.replace("/login");
		}
	}, [isPending, user, router]);

	if (isPending) {
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

	// Render nothing while redirecting
	return null;
}
