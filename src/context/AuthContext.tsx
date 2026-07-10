"use client";

import {
	createContext,
	useContext,
	useEffect,
	type ReactNode,
	useMemo,
	useCallback,
} from "react";
import { notificationService } from "@/src/services/notificationService";
import { authClient } from "@/src/features/identity/auth-client";
import type { Credentials, Role, User } from "@/src/types/auth";

interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	login: (credentials: Credentials) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapGlobalRoleToLegacyDisplayRole(role: string | null | undefined): Role {
	if (role === "super_admin" || role === "admin") {
		return "Admin";
	}

	return "Team Member";
}

function mapBetterAuthUser(
	sessionUser: NonNullable<ReturnType<typeof authClient.useSession>["data"]>["user"]
): User {
	return {
		id: sessionUser.id,
		name: sessionUser.name,
		email: sessionUser.email,
		role: mapGlobalRoleToLegacyDisplayRole(sessionUser.role),
		department: "",
		position: "",
		profile_url: sessionUser.image ?? undefined,
	};
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data, isPending, refetch } = authClient.useSession();

	const login = useCallback(async (credentials: Credentials) => {
		const result = await authClient.signIn.email({
			email: credentials.username,
			password: credentials.password,
		});

		if (result.error) {
			throw new Error(result.error.message ?? "Email atau password salah.");
		}

		await refetch();
	}, [refetch]);

	const logout = useCallback(async () => {
		notificationService.disconnect();
		await authClient.signOut();
		await refetch();
	}, [refetch]);

	const user = useMemo(() => {
		if (!data?.user) {
			return null;
		}

		return mapBetterAuthUser(data.user);
	}, [data?.user]);

	const token = data?.session.token ?? null;

	useEffect(() => {
		if (token && user) {
			notificationService.initialize(token, user);
		}
	}, [token, user]);

	const value = useMemo(
		() => ({
			user,
			token,
			isLoading: isPending,
			login,
			logout,
		}),
		[user, token, isPending, login, logout]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
