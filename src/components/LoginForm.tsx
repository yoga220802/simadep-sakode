"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AtSign, LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppToast } from "../context/ToastContext";
import { Input, Button } from "@heroui/react";

export default function LoginForm() {
	const router = useRouter();
	const { login } = useAuth();
	const { showToast } = useAppToast();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const validate = (): boolean => {
		let valid = true;

		if (!username.trim()) {
			setEmailError("Email tidak boleh kosong.");
			valid = false;
		} else if (!emailRegex.test(username)) {
			setEmailError("Format email tidak valid.");
			valid = false;
		} else {
			setEmailError(null);
		}

		if (!password.trim()) {
			setPasswordError("Password tidak boleh kosong.");
			valid = false;
		} else {
			setPasswordError(null);
		}

		return valid;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitted(true);

		if (!validate()) {
			return;
		}

		setIsLoading(true);
		try {
			await login({ username, password });
			showToast("Login berhasil! Mengarahkan ke dashboard...", "success");
			router.push("/dashboard");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Email atau password salah.";
			setEmailError(errorMessage);
			setPasswordError(errorMessage);
			showToast(errorMessage, "error");
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

			<form onSubmit={handleSubmit} noValidate className='space-y-6'>
				<Input
					type='email'
					label='Email'
					variant='bordered'
					value={username}
					isInvalid={submitted && !!emailError}
					errorMessage={submitted ? emailError : null}
					onValueChange={(value) => {
						setUsername(value);
						if (submitted) validate();
					}}
					startContent={<AtSign className='w-5 h-5 text-gray-400' />}
					classNames={{
						inputWrapper:
							"h-14 border-gray-300 group-data-[focus=true]:border-[var(--color-primary)]",
					}}
				/>

				<Input
					type='password'
					label='Password'
					variant='bordered'
					value={password}
					isInvalid={submitted && !!passwordError}
					errorMessage={submitted ? passwordError : null}
					onValueChange={(value) => {
						setPassword(value);
						if (submitted) validate();
					}}
					startContent={<LockKeyhole className='w-5 h-5 text-gray-400' />}
					classNames={{
						inputWrapper:
							"h-14 border-gray-300 group-data-[focus=true]:border-[var(--color-primary)]",
					}}
				/>

				<Button
					type='submit'
					isLoading={isLoading}
					fullWidth
					className='h-12 bg-[var(--color-primary)] text-white font-palanquin font-bold text-xl'>
					{isLoading ? "Memproses..." : "Login"}
				</Button>
			</form>
		</div>
	);
}
