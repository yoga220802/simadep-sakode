"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AtSign, LockKeyhole, LoaderCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginForm() {
	const router = useRouter();
	const { login } = useAuth();

	// state input diubah menjadi username
	const [username, setUsername] = useState("");
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
			// Mengirim username dan password ke service login
			await login({ username, password });
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
		<div className='w-[600px] max-w-[90vw] bg-white rounded-[25px] shadow-[0px_0px_60px_rgba(0,0,0,0.1)] py-12 px-10 scale-[0.8] sm:scale-100 origin-top sm:origin-center transition-transform duration-300 ease-in-out'>
			<div className='flex flex-row justify-between items-end mb-8'>
				<h1 className='font-palanquin font-bold text-3xl text-[var(--color-text-main)] hidden sm:block'>
					Login
				</h1>
				<div className='relative w-45 h-25'>
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
				{/* Input untuk Username (tampilan tetap seperti email) */}
				<div className='relative'>
					<AtSign className='absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-primary)]' />
					<input
						type='text' // Tipe bisa diubah ke text
						id='username'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder='Username or Email' // Placeholder diubah
						required
						className='w-full h-10 pl-14 pr-4 py-3 font-palanquin text-lg text-[var(--color-text-main)] border border-[var(--color-text-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none'
					/>
				</div>

				{/* Input untuk Password */}
				<div className='relative'>
					<LockKeyhole className='absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[var(--color-primary)]' />
					<input
						type='password'
						id='password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder='Password'
						required
						className='w-full h-10 pl-14 pr-4 py-3 font-palanquin text-lg text-[var(--color-text-main)] border border-[var(--color-text-main)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none'
					/>
				</div>

				{error && <p className='text-sm text-red-500 text-center'>{error}</p>}

				<button
					type='submit'
					disabled={isLoading}
					className='w-full h-12 flex items-center justify-center bg-[var(--color-primary)] text-white font-palanquin font-bold text-xl py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'>
					{isLoading ? <LoaderCircle className='animate-spin' /> : "Login"}
				</button>
			</form>
		</div>
	);
}
