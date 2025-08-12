"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { Credentials, User, AuthSession } from "../types/auth";
import { authService } from "../services/authService";

// type untuk context
interface AuthContextType {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	login: (credential: Credentials) => Promise<void>;
	logout: () => Promise<void>;
}

// default values untuk context
const authContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        try {
            const storredSession = localStorage.getItem("auth_session");
            if (storredSession) {
                setSession(JSON.parse(storredSession));
            }
        } catch(error) {
            console.error("Gagal memuat sesi dari local storage", error);
            localStorage.removeItem("auth_session");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (credential: Credentials) => {
        const newSession = await authService.login(credential);
        setSession(newSession);
        localStorage.setItem("auth_session", JSON.stringify(newSession));
    }

    const logout = async () => {
        setSession(null);
        localStorage.removeItem("auth_session");
    }

    const value = {
        user: session?.user || null,
        token: session?.token || null,
        isLoading,
        login,
        logout
    }

    return (
        <authContext.Provider value={value}>
            {children}
        </authContext.Provider>
    )
};


export const useAuth = () => {
    const context = useContext(authContext);
    if (context === undefined) {
        throw new Error("useAuth harus digunakan dalam AuthProvider");
    }
    return context;
}