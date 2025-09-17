"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { authService } from "@/src/services/authService";
import { notificationService } from "@/src/services/notificationService"; // Import service
import type { Credentials, User, AuthSession } from "@/src/types/auth";

// Helper Functions untuk mengelola Cookie (tidak berubah)
const setCookie = (name: string, value: string, days: number) => {
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = `${name}=${
		value || ""
	}${expires}; path=/; SameSite=Strict; Secure`;
};

const getCookie = (name: string): string | null => {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

const eraseCookie = (name: string) => {
	document.cookie = `${name}=; Max-Age=-99999999; path=/; SameSite=Strict; Secure`;
};

interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	login: (credentials: Credentials) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<AuthSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const validateSession = async () => {
			const token = getCookie("auth_token");
			if (token) {
				try {
					const revalidatedSession = await authService.revalidateSession(token);
					setSession(revalidatedSession);
					localStorage.setItem("auth_session", JSON.stringify(revalidatedSession));
					// Inisialisasi notifikasi setelah sesi berhasil divalidasi
					notificationService.initialize(
						revalidatedSession.token,
						revalidatedSession.user
					);
				} catch (error) {
					console.error("Sesi tidak valid, token dihapus:", error);
					eraseCookie("auth_token");
					localStorage.removeItem("auth_session");
					setSession(null);
					notificationService.disconnect(); // Pastikan disconnect jika validasi gagal
				}
			}
			setIsLoading(false);
		};

		validateSession();

		// HAPUS CLEANUP FUNCTION YANG BERMASALAH DARI SINI
		// return () => {
		// 	notificationService.disconnect();
		// };
	}, []);

	const login = async (credentials: Credentials) => {
		const newSession = await authService.login(credentials);
		setSession(newSession);
		localStorage.setItem("auth_session", JSON.stringify(newSession));
		setCookie("auth_token", newSession.token, 7);
		// Inisialisasi notifikasi TEPAT SETELAH login berhasil
		notificationService.initialize(newSession.token, newSession.user);
	};

	const logout = () => {
		setSession(null);
		localStorage.removeItem("auth_session");
		eraseCookie("auth_token");
		// Panggil disconnect saat logout
		notificationService.disconnect();
	};

	const value = {
		user: session?.user ?? null,
		token: session?.token ?? null,
		isLoading,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth harus digunakan di dalam AuthProvider");
	}
	return context;
}
