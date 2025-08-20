"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { authService } from "@/src/services/authService";
import type { Credentials, User, AuthSession } from "@/src/types/auth";

// Helper Functions untuk mengelola Cookie
const setCookie = (name: string, value: string, days: number) => {
	let expires = "";
	if (days) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const getCookie = (name: string): string | null => {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
};

const eraseCookie = (name: string) => {
	document.cookie = name + "=; Max-Age=-99999999; path=/;";
};

interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	login: (credentials: Credentials) => Promise<void>;
	logout: () => void;
}

// Membuat context dengan nilai default undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Komponen ini menyediakan state dan fungsi otentikasi ke seluruh aplikasi.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<AuthSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Coba muat sesi dari localStorage saat komponen pertama kali dimuat
	useEffect(() => {
		try {
			const storedSession = localStorage.getItem("auth_session");
			if (storedSession) {
				setSession(JSON.parse(storedSession));
			}
		} catch (error) {
			console.error("Gagal memuat sesi dari localStorage", error);
			localStorage.removeItem("auth_session");
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Fungsi untuk menangani login
	const login = async (credentials: Credentials) => {
		const newSession = await authService.login(credentials);
		setSession(newSession);

		localStorage.setItem("auth_session", JSON.stringify(newSession));
		setCookie("auth_token", newSession.token, 7);
	};

	// Fungsi untuk menangani logout
	const logout = () => {
		setSession(null);

		localStorage.removeItem("auth_session");
		eraseCookie("auth_token");
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