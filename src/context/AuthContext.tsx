"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { authService } from "@/src/services/authService";
import { notificationService } from "@/src/services/notificationService";
import type { Credentials, User, AuthSession } from "@/src/types/auth";

// Helper Functions for Cookie Management (unchanged)
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

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<AuthSession | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const validateSession = async () => {
			const token = getCookie("auth_token");
			if (token) {
				try {
					const revalidatedSession = await authService.revalidateSession(token);
					setSession(revalidatedSession);
					// Initialize notification service AFTER session is successfully validated
					notificationService.initialize(
						revalidatedSession.token,
						revalidatedSession.user
					);
				} catch (error) {
					console.error("Session invalid, clearing token:", error);
					eraseCookie("auth_token");
					setSession(null);
					notificationService.disconnect();
				}
			}
			setIsLoading(false);
		};

		validateSession();
	}, []);

	const login = async (credentials: Credentials) => {
		const newSession = await authService.login(credentials);
		setSession(newSession);
		setCookie("auth_token", newSession.token, 7);
		// Initialize notification service right after a successful login
		notificationService.initialize(newSession.token, newSession.user);
	};

	const logout = () => {
		// Disconnect from notification service BEFORE clearing session
		notificationService.disconnect();
		setSession(null);
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
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
