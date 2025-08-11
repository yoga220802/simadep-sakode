import type { Metadata } from "next";
import { Palanquin } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

// Konfigurasi font Palanquin sesuai desain
const palanquin = Palanquin({
	subsets: ["latin"],
	weight: ["400", "700"],
	display: "swap",
	variable: "--font-palanquin", // Kunci: Mengekspos font sebagai CSS variable
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
		// Menerapkan variabel font ke seluruh dokumen
		<html lang='id' className={palanquin.variable}>
			<body className='font-palanquin'>
				{" "}
				{/* Default font */}
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
