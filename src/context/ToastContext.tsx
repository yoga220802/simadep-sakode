"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { addToast } from "@heroui/react";
import type { ToastProps } from "@heroui/toast";

type ToastType = "success" | "error" | "info";

interface AppToastContextType {
	showToast: (message: string, type: ToastType) => void;
}

const AppToastContext = createContext<AppToastContextType | undefined>(
	undefined
);

export function AppToastProvider({ children }: { children: ReactNode }) {
	const showToast = useCallback((message: string, type: ToastType) => {
		let color: ToastProps["color"];
		let title = "";

		switch (type) {
			case "success":
				color = "success";
				title = "Berhasil";
				break;
			case "error":
				color = "danger";
				title = "Gagal";
				break;
			case "info":
			default:
				color = "primary";
				title = "Informasi";
				break;
		}

		addToast({
			title: title,
			description: message,
			color: color,
			shouldShowTimeoutProgress: true,
			timeout: 4000,
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
