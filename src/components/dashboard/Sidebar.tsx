"use client";

import { useState, useEffect } from "react"; // Import hooks
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useSidebar } from "@/src/context/SidebarContext";
import { sidebarService } from "@/src/services/sidebarService"; // Import service baru
import {
	LayoutDashboard,
	Rocket,
	Users,
	LogOut,
	UserRound,
	ClipboardList,
} from "lucide-react";

// Definisikan tipe untuk link navigasi
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
	{ href: "/users", label: "Pegawai", icon: Users, roles: ["Admin"] },
	{ href: "/clients", label: "Klien", icon: UserRound, roles: ["Admin"] },
	{
		href: "/tasks",
		label: "Tugas",
		icon: ClipboardList,
		roles: ["Project Manager", "Team Member"],
	},
	{
		href: "/projects",
		label: "Proyek",
		icon: Rocket,
		roles: ["Admin", "Project Manager", "Team Member"],
	},
];

export default function Sidebar() {
	const { user, logout } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const { isSidebarOpen, openOnHover, closeOnHover } = useSidebar();

	// State untuk menyimpan jumlah data dari API
	const [menuCounts, setMenuCounts] = useState<{
		projects: number;
		tasks: number;
	} | null>(null);

	useEffect(() => {
		// Ambil data hanya jika user adalah PM atau Member
		if (user?.role === "Project Manager" || user?.role === "Team Member") {
			sidebarService.getMenuCounts().then(setMenuCounts);
		}
	}, [user]); // Jalankan setiap kali data user berubah

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
				isSidebarOpen ? "w-64" : "w-20" // Menggunakan nilai standar Tailwind
			}`}
			onMouseEnter={openOnHover}
			onMouseLeave={closeOnHover}>
			<nav className='flex-1 px-4 py-6 space-y-2'>
				{accessibleLinks.map((link) => {
					// Logika untuk mendapatkan jumlah yang sesuai untuk setiap menu
					const count =
						link.label === "Proyek"
							? menuCounts?.projects
							: link.label === "Tugas"
							? menuCounts?.tasks
							: null;

					return (
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
							<div
								className={`flex-1 flex justify-between items-center transition-opacity duration-200 whitespace-nowrap ${
									isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
								}`}>
								<span>{link.label}</span>
								{count != null && count > 0 && (
									<span className='bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full'>
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
