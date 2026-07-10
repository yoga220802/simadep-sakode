"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AtSign, LockKeyhole } from "lucide-react";
import { authClient } from "@/src/features/identity/auth-client";
import { useAppToast } from "../context/ToastContext";
import { Input, Button } from "@heroui/react";

export default function LoginForm() {
	const router = useRouter();
	const { showToast } = useAppToast();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const [emailError, setEmailError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const validate = (): boolean => {
		let isValid = true;
		const newEmailError = !username.trim()
			? "Email tidak boleh kosong."
			: !emailRegex.test(username)
			? "Format email tidak valid."
			: null;
		const newPasswordError = !password.trim()
			? "Password tidak boleh kosong."
			: null;

		setEmailError(newEmailError);
		setPasswordError(newPasswordError);

		if (newEmailError || newPasswordError) {
			isValid = false;
		}

		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setSubmitted(true);

		if (!validate()) {
			return;
		}

		setIsLoading(true);

		try {
			const result = await authClient.signIn.email({
				email: username,
				password,
			});

			if (result.error) {
				throw new Error(result.error.message ?? "Email atau password salah.");
			}

			showToast("Login berhasil! Mengarahkan ke dashboard...", "success");
			router.push("/dashboard");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Email atau password salah.";
			showToast(errorMessage, "error");
			setEmailError(" "); // Set to a non-empty string to trigger isInvalid
			setPasswordError(" "); // Set to a non-empty string to trigger isInvalid
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='w-[600px] max-w-[90vw] bg-white rounded-[25px] shadow-[0px_0px_60px_rgba(0,0,0,0.1)] py-12 px-10 scale-[0.8] sm:scale-100 origin-top sm:origin-center transition-transform duration-300 ease-in-out'>
			<div className='flex flex-row justify-between items-end mb-8'>
				<h1 className='font-bold text-3xl text-[var(--color-text-main)] hidden sm:block'>
					Login
				</h1>
				<div className='relative h-20 w-60'>
					<Image
						src='/brand/simadep-sakode-logo-exact.svg'
						alt='Logo SIMADEP'
						fill
						className='object-contain'
					/>
				</div>
			</div>

			<form onSubmit={handleSubmit} noValidate className='space-y-6'>
				<Input
					isRequired
					type='email'
					label='Email'
					variant='bordered'
					value={username}
					isInvalid={!!emailError}
					errorMessage={emailError}
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
					isRequired
					type='password'
					label='Password'
					variant='bordered'
					value={password}
					isInvalid={!!passwordError}
					errorMessage={passwordError}
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
					className='h-12 bg-[var(--color-primary)] text-[var(--simadep-foreground)] font-bold text-xl'>
					{isLoading ? "Memproses..." : "Login"}
				</Button>
			</form>
		</div>
	);
}
