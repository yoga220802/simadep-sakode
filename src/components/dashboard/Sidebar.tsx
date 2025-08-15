"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useSidebar } from "@/src/context/SidebarContext";
import { LayoutDashboard, FolderKanban, Users, LogOut } from "lucide-react";

interface NavLink {
	href: string;
	label: string;
	icon: React.ElementType;
	roles: ("Admin" | "Project Manager" | "Team Member")[];
}

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
	const { isSidebarOpen } = useSidebar();

	const handleLogout = () => {
		logout();
		router.push("/login");
	};

	const accessibleLinks = navLinks.filter(
		(link) => user && link.roles.includes(user.role)
	);

	return (
		<aside
			className={`bg-white text-text-main flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out ${
				isSidebarOpen ? "w-72" : "w-20"
			}`}>
			{/* Fitur Sidebar */}
			<nav className='flex-1 px-4 py-6 space-y-2'>
				{accessibleLinks.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						title={link.label}
						className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
							pathname === link.href
								? "bg-primary/10 text-primary font-bold"
								: "hover:bg-gray-100"
						} ${!isSidebarOpen && "justify-center"}`}>
						<link.icon className='w-6 h-6 flex-shrink-0' />
						<span
							className={`transition-opacity duration-200 whitespace-nowrap ${
								isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
							}`}>
							{link.label}
						</span>
					</Link>
				))}
			</nav>

			{/* User Profile & Logout */}
			<div className='p-4 border-t border-gray-200'>
				<div
					className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${
						!isSidebarOpen && "justify-center"
					}`}>
					<div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0'>
						{user?.name.charAt(0).toUpperCase()}
					</div>
					<div
						className={`flex-1 overflow-hidden transition-opacity duration-200 ${
							isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
						}`}>
						<p className='font-bold text-sm truncate'>{user?.name}</p>
						<p className='text-xs text-gray-500 truncate'>{user?.position}</p>
					</div>
					<button
						onClick={handleLogout}
						title='Logout'
						className={`${isSidebarOpen ? "" : "hidden"}`}>
						<LogOut className='w-5 h-5 text-gray-500 hover:text-red-500' />
					</button>
				</div>
			</div>
		</aside>
	);
}
