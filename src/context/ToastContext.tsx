"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { addToast } from "@heroui/react";
import type { ToastProps } from "@heroui/toast";

type ToastType = "success" | "error" | "info";

type ToastPromiseHandlers<T = unknown> = {
	loading: string;
	success: (result: T) => string;
	error: (error: Error) => string; // FIX: Gunakan tipe Error, bukan any
};

interface AppToastContextType {
	// FIX: Ganti `any` dengan `unknown` untuk promise dan handlers
	showToast: (
		message: string | Promise<unknown>,
		typeOrHandlers: ToastType | ToastPromiseHandlers<unknown>
	) => void;
}

const AppToastContext = createContext<AppToastContextType | undefined>(
	undefined
);

// FIX: Ganti `any` dengan generic type T
function addToastPromise<T>(
	promise: Promise<T>,
	handlers: ToastPromiseHandlers<T>
): void {
	addToast({
		title: "Loading",
		description: handlers.loading,
		color: "default",
		shouldShowTimeoutProgress: true,
		timeout: 1000,
	});

	promise
		.then((result: T) => {
			// Replace the loading toast with a success toast
			addToast({
				title: "Success",
				description: handlers.success(result),
				color: "success",
				shouldShowTimeoutProgress: true,
				timeout: 5000,
			});
		})
		.catch((err: Error) => {
			// Replace the loading toast with an error toast
			addToast({
				title: "Error",
				description: handlers.error(err),
				color: "danger",
				shouldShowTimeoutProgress: true,
				timeout: 5000,
			});
		})
}

export function AppToastProvider({ children }: { children: ReactNode }) {
	const showToast = useCallback(
		(
			message: string | Promise<unknown>, // FIX: Gunakan unknown
			typeOrHandlers: ToastType | ToastPromiseHandlers<unknown> // FIX: Gunakan unknown
		) => {
			if (message instanceof Promise) {
				addToastPromise(
					message,
					typeOrHandlers as ToastPromiseHandlers<unknown> // Cast setelah pengecekan
				);
			} else {
				const type = typeOrHandlers as ToastType;
				let color: ToastProps["color"] = "default";
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
					timeout: 5000,
				});
			}
		},
		[]
	);

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
