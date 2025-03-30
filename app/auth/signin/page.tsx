"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";
import Link from "next/link";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";

export default function SignInPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectPath = searchParams.get("redirect") ? decodeURIComponent(searchParams.get("redirect")!) : "/profile";
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const res = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (!res?.error) {
				router.push(redirectPath);
				router.refresh();
			} else {
				setError("Неверный email или пароль");
			}
		} catch {
			setError("Произошла ошибка при входе");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50'>
			<div className='max-w-md w-full p-8 bg-white rounded-lg shadow-md space-y-6'>
				<h2 className='text-center text-2xl font-bold text-gray-900'>Вход в аккаунт</h2>

				{error && <div className='bg-red-50 border border-red-400 text-red-700 p-3 rounded'>{error}</div>}

				<form className='space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-4'>
						<div>
							<label htmlFor='email' className='block text-sm font-medium text-gray-700'>
								Email
							</label>
							<Input id='email' name='email' type='email' required placeholder='Введите email' />
						</div>

						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-700'>
								Пароль
							</label>
							<Input id='password' name='password' type='password' required placeholder='Введите пароль' />
						</div>
					</div>

					<Button type='submit' isLoading={isLoading} fullWidth>
						{isLoading ? "Вход..." : "Войти"}
					</Button>
				</form>

				<div className='text-center'>
					<Link href='/auth/register' className='text-black hover:text-gray-700 text-sm font-medium'>
						Нет аккаунта? Зарегистрироваться
					</Link>
				</div>
			</div>
		</div>
	);
}
