"use client";

import Image from "next/image"; // Import Image
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/src/features/identity/auth-client";
import { notificationStore } from "@/src/features/notifications/client/notification-store";
import { useSessionUser } from "@/src/features/identity/session-client";
import { useNavigationCapabilities } from "@/src/features/navigation/client/use-navigation-capabilities";
import { useSidebar } from "@/src/context/SidebarContext";
import {
	LayoutDashboard,
	Rocket,
	Users,
	LogOut,
	ClipboardList,
	Building2,
	type LucideIcon,
} from "lucide-react";
import type { NavigationCapabilities } from "@/src/features/navigation";

interface NavLink {
	href: string;
	label: string;
	icon: LucideIcon;
	capability: keyof Pick<
		NavigationCapabilities,
		| "canViewDashboard"
		| "canViewUserManagement"
		| "canViewDepartments"
		| "canViewProjects"
		| "canViewMyTasks"
	>;
	countKey?: "projects" | "tasks";
}

const navLinks: NavLink[] = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		capability: "canViewDashboard",
	},
	{
		href: "/users",
		label: "Pegawai",
		icon: Users,
		capability: "canViewUserManagement",
	},
	{
		href: "/departments",
		label: "Departemen",
		icon: Building2,
		capability: "canViewDepartments",
	},
	{
		href: "/tasks",
		label: "Tugas",
		icon: ClipboardList,
		capability: "canViewMyTasks",
		countKey: "tasks",
	},
	{
		href: "/projects",
		label: "Proyek",
		icon: Rocket,
		capability: "canViewProjects",
		countKey: "projects",
	},
];

export default function Sidebar() {
	const { user } = useSessionUser();
	const { capabilities } = useNavigationCapabilities();
	const pathname = usePathname();
	const router = useRouter();
	const { isSidebarOpen, openOnHover, closeOnHover } = useSidebar();

	const handleLogout = async () => {
		notificationStore.disconnect();
		await authClient.signOut();
		router.push("/login");
	};

	if (!user) {
		return null; // Atau tampilkan skeleton loader
	}

	const accessibleLinks = capabilities
		? navLinks.filter((link) => capabilities[link.capability])
		: navLinks.filter((link) => link.capability === "canViewDashboard");

	// Ambil data statistik langsung dari user object
	const getCount = (key?: "projects" | "tasks"): number | null => {
		if (!key) return null;
		return null;
	};

	return (
		<aside
			className={`bg-white text-text-main flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out ${
				isSidebarOpen ? "w-64" : "w-20"
			}`}
			onMouseEnter={openOnHover}
			onMouseLeave={closeOnHover}>
			<nav className='flex-1 px-4 py-6 space-y-2'>
				{accessibleLinks.map((link) => {
					const count = getCount(link.countKey);
					return (
						<Link
							key={link.href}
							href={link.href}
							title={link.label}
							className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
								pathname === link.href
									? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold"
									: "hover:bg-gray-100"
							} ${!isSidebarOpen && "justify-center"}`}>
							<link.icon className='w-6 h-6 flex-shrink-0' />
							<div
								className={`flex-1 flex justify-between items-center transition-opacity duration-200 whitespace-nowrap ${
									isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
								}`}>
								<span>{link.label}</span>
								{count != null && count > 0 && (
									<span className='bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full'>
										{count}
									</span>
								)}
							</div>
						</Link>
					);
				})}
			</nav>

			{/* User Profile & Logout */}
			<div className='p-4 border-t border-gray-200'>
				<div
					className={`flex items-center gap-3 p-2 rounded-lg ${
						!isSidebarOpen && "justify-center"
					}`}>
					{user.profile_url ? (
						<Image
							src={user.profile_url}
							alt={user.name}
							width={40}
							height={40}
							unoptimized={true}
							className='rounded-full flex-shrink-0'
						/>
					) : (
						<div className='w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center font-bold text-[var(--color-primary)] flex-shrink-0'>
							{user.name.charAt(0).toUpperCase()}
						</div>
					)}
					<div
						className={`flex-1 overflow-hidden transition-opacity duration-200 ${
							isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
						}`}>
						<p className='font-bold text-sm truncate'>{user.name}</p>
						<p className='text-xs text-gray-500 truncate'>{user.position}</p>
					</div>
					<button
						onClick={handleLogout}
						title='Logout'
						className={`${isSidebarOpen ? "" : "hidden"} ml-auto`}>
						<LogOut className='w-5 h-5 text-gray-500 hover:text-[var(--color-secondary)]' />
					</button>
				</div>
			</div>
		</aside>
	);
}
