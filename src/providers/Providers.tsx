"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider as HeroToastProvider } from "@heroui/toast";
import { AppToastProvider } from "../context/ToastContext";

// Komponen ini membungkus semua provider yang dibutuhkan oleh aplikasi
export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<HeroUIProvider>
			<HeroToastProvider />
			<AppToastProvider>{children}</AppToastProvider>
		</HeroUIProvider>
	);
}
