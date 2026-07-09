"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/src/context/SidebarContext";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
export default function Header() {
	const { isSidebarOpen, toggleSidebar } = useSidebar();

	return (
		<header className='bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center h-18'>
			{/* Logo container */}
			<div className='flex-shrink-0 flex items-center justify-start h-full w-72 pl-6'>
				<Link href='/dashboard'>
					<div className='relative h-10 w-44'>
						<Image
							src='/brand/simadep-logo-compact.svg'
							alt='Logo SIMADEP'
							fill
							className='object-contain object-left'
						/>
					</div>
				</Link>
			</div>

			{/* Main Header Content Area */}
			<div className='flex-1 flex items-center justify-between px-6'>
				{/* Left side: Toggle and Search */}
				<div className='flex items-center gap-6'>
					<button
						onClick={toggleSidebar}
						className='w-[50px] h-[50px] flex items-center justify-center border-[1.5px] border-[#E4E7EC] rounded-[10px] hover:bg-gray-100 transition-colors'
						aria-label='Toggle Sidebar'>
						{isSidebarOpen ? (
							<PanelLeftClose className='w-7 h-7 text-[#667085]' />
						) : (
							<PanelLeftOpen className='w-7 h-7 text-[#667085]' />
						)}
					</button>

					<div className='relative hidden lg:block'>
						<Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
						<input
							type='text'
							placeholder='Cari...'
							className='pl-12 pr-4 py-3 w-full sm:w-80 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
						/>
					</div>
				</div>

				{/* Right side: Notifications */}
				<div className='flex items-center gap-4'>
					<NotificationDropdown />
				</div>
			</div>
		</header>
	);
}
