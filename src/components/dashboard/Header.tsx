"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "@/src/context/SidebarContext";
import { Bell, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";

export default function Header() {
	const { isSidebarOpen, toggleSidebar } = useSidebar();

	return (
		<header className='bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center h-[89px]'>
			{/* Logo container */}
			<div className='flex-shrink-0 flex items-center justify-center h-full w-72'>
				<Link href='/dashboard'>
					<div className='relative h-10 w-32'>
						<Image
							src='/logo-color.svg'
							alt='Logo Digitak'
							fill
							className='object-contain object-left'
							onError={(e) =>
								(e.currentTarget.src =
									"https://placehold.co/128x40/FFFFFF/333?text=Logo")
							}
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
							placeholder='Search...'
							className='pl-12 pr-4 py-3 w-full sm:w-80 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary'
						/>
					</div>
				</div>

				{/* Right side: Notifications */}
				<div className='flex items-center gap-4'>
					<button
						className='relative p-2 rounded-full hover:bg-gray-100'
						title='Notifications'>
						<Bell className='w-6 h-6 text-gray-600' />
						<span className='absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white'></span>
					</button>
				</div>
			</div>
		</header>
	);
}
