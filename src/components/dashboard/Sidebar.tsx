"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import {
	LayoutDashboard,
	FolderKanban,
	Users,
	LogOut,
	ChevronDown,
} from "lucide-react";

// Type untuk link navigasi
interface NavLink {
	href: string;
	label: string;
	icon: React.ElementType;
	roles: ("Admin" | "Project Manager" | "Team Member")[];
}

// Daftar semua link navigasi yang mungkin
const navLinks: NavLink[] = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		roles: ["Admin", "Project Manager", "Team Member"],
	},
	{
		href: "/projects",
		label: "Projects",
		icon: FolderKanban,
		roles: ["Admin", "Project Manager", "Team Member"],
	},
	{ href: "/users", label: "User Management", icon: Users, roles: ["Admin"] },
];

export default function Sidebar() {
	const { user, logout } = useAuth();
	const pathname = usePathname();
	const router = useRouter();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	// Filter link navigasi berdasarkan role user yang sedang login
	const accessibleLinks = navLinks.filter(
		(link) => user && link.roles.includes(user.role)
	);

	return (
		<aside className='w-64 bg-white text-text-main flex flex-col border-r border-gray-200'>
			{/* Logo */}
			<div className='p-6 border-b border-gray-200'>
				<Link href='/dashboard'>
					<div className='relative h-10'>
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

			{/* Navigasi */}
			<nav className='flex-1 px-4 py-6 space-y-2'>
				{accessibleLinks.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
							pathname === link.href
								? "bg-primary/10 text-primary font-bold"
								: "hover:bg-gray-100"
						}`}>
						<link.icon className='w-5 h-5' />
						<span>{link.label}</span>
					</Link>
				))}
			</nav>

			{/* User Profile & Logout */}
			<div className='p-4 border-t border-gray-200'>
				<div className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer'>
					<div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary'>
						{user?.name.charAt(0).toUpperCase()}
					</div>
					<div className='flex-1 overflow-hidden'>
						<p className='font-bold text-sm truncate'>{user?.name}</p>
						<p className='text-xs text-gray-500 truncate'>{user?.position}</p>
					</div>
					<button onClick={handleLogout} title='Logout'>
						<LogOut className='w-5 h-5 text-gray-500 hover:text-red-500' />
					</button>
				</div>
			</div>
		</aside>
	);
}
