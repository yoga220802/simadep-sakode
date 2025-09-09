"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { addToast } from "@heroui/react";
import type { ToastProps } from "@heroui/toast";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface AppToastContextType {
	showToast: (message: string, type: ToastType) => void;
}

const AppToastContext = createContext<AppToastContextType | undefined>(
	undefined
);

export function AppToastProvider({ children }: { children: ReactNode }) {
	const showToast = useCallback((message: string, type: ToastType) => {
		let color: ToastProps["color"] = "default";
		let title = "";
		let icon: ReactNode | null = null;

		switch (type) {
			case "success":
				color = "success";
				title = "Berhasil";
				icon = <CheckCircle className='text-green-500' />;
				break;
			case "error":
				color = "danger";
				title = "Gagal";
				icon = <AlertCircle className='text-red-500' />;
				break;
			case "info":
			default:
				color = "primary";
				title = "Informasi";
				icon = <Info className='text-blue-500' />;
				break;
		}

		addToast({
			title: title,
			description: message,
			color: color,
			// icon: icon,
			shouldShowTimeoutProgress: true,
			timeout: 5000,
		});
	}, []);

	return (
		<AppToastContext.Provider value={{ showToast }}>
			{children}
		</AppToastContext.Provider>
	);
}

export function useAppToast() {
	const context = useContext(AppToastContext);
	if (!context) {
		throw new Error("useAppToast must be used within a AppToastProvider");
	}
	return context;
}
