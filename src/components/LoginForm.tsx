"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, LoaderCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
	const router = useRouter();
	const { login } = useAuth();

	// state input
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	// state condition
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// handler
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await login({ email, password });
			// Redirect ke dashboard setelah login berhasil
			router.push("/dashboard");
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("Terjadi kesalahan saat login.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='w-full max-w-lg bg-white rounded-[25px] shadow-[0px_0px_60px_rgba(0,0,0,0.1)] p-16'>
			{/* Logo and Title Section */}
			<div className='flex justify-between items-center mb-8'>
				<h1 className='font-palanquin font-bold text-3xl text-text-main'>Login</h1>
				<div className='relative w-32 h-12'>
					<Image
						src='/logo-color.svg'
						alt='Logo Proyek'
						fill
						className='object-contain'
						onError={(e) =>
							(e.currentTarget.src =
								"https://placehold.co/128x48/FFFFFF/333?text=Logo")
						}
					/>
				</div>
			</div>

			<form onSubmit={handleSubmit} className='space-y-6'>
				{/* Input untuk Email */}
				<div className='relative'>
					<Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-primary)]' />
					<input
						type='email'
						id='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder='Email'
						required
						className='w-full pl-14 pr-4 py-3 font-palanquin text-lg text-text-main border border-text-main rounded-lg focus:ring-2 focus:ring-primary focus:outline-none'
					/>
				</div>

				{/* Input untuk Password */}
				<div className='relative'>
					<Lock className='absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-primary)]' />
					<input
						type='password'
						id='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder='Password'
						required
						className='w-full pl-14 pr-4 py-3 font-palanquin text-lg text-text-main border border-text-main rounded-lg focus:ring-2 focus:ring-primary focus:outline-none'
					/>
				</div>

				{/* Menampilkan pesan error jika ada */}
				{error && <p className='text-sm text-red-500 text-center'>{error}</p>}

				{/* Tombol Login */}
				<button
					type='submit'
					disabled={isLoading}
					className='w-full h-16 flex items-center justify-center bg-[var(--color-primary)] text-white font-palanquin font-bold text-xl py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'>
					{isLoading ? <LoaderCircle className='animate-spin' /> : "Login"}
				</button>
			</form>
		</div>
	);
}
