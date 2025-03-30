"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";

export default function RegisterPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(e.currentTarget);
		const data = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			password: formData.get("password") as string,
		};

		try {
			const res = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.error || "Ошибка при регистрации");
			}

			router.push("/auth/signin");
		} catch (error) {
			setError(error instanceof Error ? error.message : "Произошла ошибка при регистрации");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50'>
			<div className='max-w-md w-full p-8 bg-white rounded-lg shadow-md space-y-6'>
				<h2 className='text-center text-2xl font-bold text-gray-900'>Регистрация</h2>

				{error && <div className='bg-red-50 border border-red-400 text-red-700 p-3 rounded'>{error}</div>}

				<form className='space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-4'>
						<div>
							<label htmlFor='name' className='block text-sm font-medium text-gray-700'>
								Имя
							</label>
							<Input id='name' name='name' type='text' required placeholder='Введите имя' />
						</div>

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
						{isLoading ? "Регистрация..." : "Зарегистрироваться"}
					</Button>
				</form>

				<div className='text-center'>
					<Link href='/auth/signin' className='text-black hover:text-gray-700 text-sm font-medium'>
						Уже есть аккаунт? Войти
					</Link>
				</div>
			</div>
		</div>
	);
}
