"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { addToast, closeToast } from "@heroui/toast";
import type { ToastProps } from "@heroui/toast";

type ToastType = "success" | "error" | "info";

type ToastPromiseHandlers<T = unknown> = {
	loading: string;
	success: (result: T) => string;
	error: (error: Error) => string; // FIX: Gunakan tipe Error, bukan any
};

interface AppToastContextType {
	showToast: (
		message: string | Promise<unknown>,
		typeOrHandlers: ToastType | ToastPromiseHandlers<unknown>
	) => void;
	showLoadingToast: (message: string, title?: string) => () => void;
}

const AppToastContext = createContext<AppToastContextType | undefined>(
	undefined
);

// FIX: Ganti `any` dengan generic type T
function addToastPromise<T>(
	promise: Promise<T>,
	handlers: ToastPromiseHandlers<T>
): void {
	const loadingToastKey = addLoadingToast({
		title: "Memproses",
		description: handlers.loading,
	});

	promise
		.then((result: T) => {
			closeToastIfPresent(loadingToastKey);
			addToast({
				title: "Berhasil",
				description: handlers.success(result),
				color: "success",
				shouldShowTimeoutProgress: true,
				timeout: 5000,
			});
		})
		.catch((err: Error) => {
			closeToastIfPresent(loadingToastKey);
			addToast({
				title: "Gagal",
				description: handlers.error(err),
				color: "danger",
				shouldShowTimeoutProgress: true,
				timeout: 5000,
			});
		})
}

export function AppToastProvider({ children }: { children: ReactNode }) {
	const showLoadingToast = useCallback((message: string, title = "Memproses") => {
		const toastKey = addLoadingToast({ title, description: message });

		return () => closeToastIfPresent(toastKey);
	}, []);

	const showToast = useCallback(
		(
			message: string | Promise<unknown>,
			typeOrHandlers: ToastType | ToastPromiseHandlers<unknown>
		) => {
			if (message instanceof Promise) {
				addToastPromise(
					message,
					typeOrHandlers as ToastPromiseHandlers<unknown>
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
		<AppToastContext.Provider value={{ showToast, showLoadingToast }}>
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

function addLoadingToast({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return addToast({
		title,
		description,
		color: "primary",
		severity: "primary",
		timeout: 60000,
		hideCloseButton: true,
		loadingComponent: (
			<span
				aria-hidden="true"
				className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
			/>
		),
		classNames: {
			base: "border border-[var(--simadep-border)]",
			title: "font-extrabold text-[var(--color-text-main)]",
			description: "text-[var(--simadep-muted)]",
		},
	});
}

function closeToastIfPresent(key: string | null) {
	if (key) {
		closeToast(key);
	}
}
