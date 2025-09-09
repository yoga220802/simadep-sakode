"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import { addToast } from "@heroui/react";
import type { ToastProps } from "@heroui/toast";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

type ToastPromiseHandlers = {
	loading: string;
	success: (result: any) => string;
	error: (error: any) => string;
};

interface AppToastContextType {
	showToast: (message: string | Promise<any>, typeOrHandlers: ToastType | ToastPromiseHandlers) => void;
}

const AppToastContext = createContext<AppToastContextType | undefined>(
	undefined
);

function addToastPromise<T>(
	promise: Promise<T>,
	handlers: ToastPromiseHandlers
): void {
	let toastId: string | null = null;

	toastId = addToast({
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
		.finally(() => {
			// Optionally, you can implement a mechanism to track and remove the loading toast
			toastId = null; // Clear the reference to the toast
		});
}

export function AppToastProvider({ children }: { children: ReactNode }) {
	const showToast = useCallback(
		(message: string | Promise<any>, typeOrHandlers: ToastType | ToastPromiseHandlers) => {
			if (message instanceof Promise) {
				addToastPromise(message, typeOrHandlers as ToastPromiseHandlers);
			} else {
				const type = typeOrHandlers as ToastType;
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
