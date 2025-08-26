"use client";

import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "../context/AuthContext";

// Komponen ini membungkus semua provider yang dibutuhkan oleh aplikasi
export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<HeroUIProvider>
			<AuthProvider>{children}</AuthProvider>
		</HeroUIProvider>
	);
}
