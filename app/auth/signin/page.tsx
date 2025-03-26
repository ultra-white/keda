"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";
import React from "react";

export default function SignInPage({
	searchParams = {},
}: {
	searchParams?: { [key: string]: string | string[] | undefined };
}) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Используем React.use() для работы с searchParams
	const params = React.use(searchParams);
	const redirectPath = typeof params.redirect === "string" ? params.redirect : "/profile";

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);

		try {
			const res = await signIn("credentials", {
				email: formData.get("email"),
				password: formData.get("password"),
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
			<div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md'>
				<div>
					<h2 className='text-center text-3xl font-bold text-gray-900'>Вход в аккаунт</h2>
				</div>

				{error && (
					<div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative'>{error}</div>
				)}

				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
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

					<div>
						<Button type='submit' isLoading={isLoading} fullWidth>
							{isLoading ? "Вход..." : "Войти"}
						</Button>
					</div>
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
