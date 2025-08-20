"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
	isSidebarOpen: boolean;
	toggleSidebar: () => void;
	openOnHover: () => void;
	closeOnHover: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
	const [sidebarPinned, setSidebarPinned] = useState(true);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	// mengubah status langsung
	const toggleSidebar = () => {
		const newPinnedState = !sidebarPinned;
		setSidebarPinned(newPinnedState);
		setIsSidebarOpen(newPinnedState);
	};

	// Fungsi saat mouse hover.
	// Hanya akan membuka sidebar jika sedang mode hide.
	const openOnHover = () => {
		if (!sidebarPinned) {
			setIsSidebarOpen(true);
		}
	};

	// Fungsi saat mouse unhover.
	// Hanya akan menutup sidebar jika sedang mode hide.
	const closeOnHover = () => {
		if (!sidebarPinned) {
			setIsSidebarOpen(false);
		}
	};

	return (
		<SidebarContext.Provider
			value={{ isSidebarOpen, toggleSidebar, openOnHover, closeOnHover }}>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error("useSidebar harus digunakan di dalam SidebarProvider");
	}
	return context;
}
