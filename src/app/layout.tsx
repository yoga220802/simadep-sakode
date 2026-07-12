import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "../providers/Providers";

const nunito = Nunito({
	subsets: ["latin"],
	weight: ["400", "600", "700", "800"],
	display: "swap",
	variable: "--font-nunito",
});

export const metadata: Metadata = {
	title: {
		default: "SIMADEP",
		template: "%s | SIMADEP",
	},
	description:
		"Sistem Manajemen Departemen untuk kolaborasi proyek, tugas, dan pegawai.",
	icons: {
		icon: "/icon.svg",
		shortcut: "/icon.svg",
		apple: "/icon.svg",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='id' className={nunito.variable} suppressHydrationWarning>
			<body className={nunito.className} suppressHydrationWarning>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
