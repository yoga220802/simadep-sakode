import React from "react";

//  Layout semua halaman di dalam auth group route
export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main className='flex items-center justify-center min-h-screen bg-background-light'>
			{children}
		</main>
	);
}
