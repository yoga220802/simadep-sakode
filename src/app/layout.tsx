import type { Metadata } from "next";
import { Palanquin } from "next/font/google";
import "./globals.css";
import { Providers } from "../providers/Providers"; // Import Providers

// Konfigurasi font Palanquin
const palanquin = Palanquin({
	subsets: ["latin"],
	weight: ["400", "700"],
	display: "swap",
	variable: "--font-palanquin",
});

export const metadata: Metadata = {
	title: "Sistem Manajemen dan Informasi Proyek",
	description: "Platform kolaborasi untuk mengelola proyek Anda.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='id' className={palanquin.variable}>
			<body className='font-palanquin'>
				{/* Bungkus semua children dengan Providers */}
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
