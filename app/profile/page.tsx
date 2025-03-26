"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";
import Link from "next/link";
import { ShieldCheck, LogOut, Package } from "lucide-react";
import OrdersList from "@/app/components/profile/OrdersList";

// Расширяем типы Next.js для поддержки свойства role
declare module "next-auth" {
	interface User {
		role?: string;
	}

	interface Session {
		user?: User;
	}
}

const ProfilePage = memo(function ProfilePage() {
	const { data: session, status, update } = useSession();
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState("");

	// Проверка, является ли пользователь администратором
	const isAdmin = session?.user?.role === "ADMIN";

	// Обновляем локальное состояние только при первой загрузке
	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		} else if (status === "authenticated" && session?.user?.name && !displayName) {
			setName(session.user.name);
			setDisplayName(session.user.name);
		}
	}, [status, router, displayName, session?.user?.name]);

	// Показываем загрузку, пока проверяем сессию
	if (status === "loading") {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='text-gray-500'>Загрузка...</div>
			</div>
		);
	}

	// Если нет сессии и статус не loading, возвращаем null
	if (!session) {
		return null;
	}

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/profile/update", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Ошибка при обновлении профиля");
			}

			// Обновляем локальное состояние
			setDisplayName(name);
			setIsEditing(false);

			// Обновляем сессию в фоновом режиме без ожидания завершения
			void update();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Произошла ошибка");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignOut = async () => {
		await signOut({
			redirect: true,
			callbackUrl: "/",
		});
	};

	return (
		<div className='container mx-auto px-[25px] lg:px-[50px] py-12'>
			{/* Заголовок и кнопки */}
			<div className='flex justify-between w-full items-center mb-8'>
				<h1 className='text-3xl font-bold'>Мой профиль</h1>
				<div className='flex md:space-x-4 flex-col md:flex-row md:w-auto w-min'>
					{isAdmin && (
						<Link href='/admin' className='flex items-center text-black hover:text-gray-700 focus:outline-none'>
							<ShieldCheck className='h-5 w-5 mr-2' />
							Панель управления
						</Link>
					)}
					<button
						onClick={handleSignOut}
						className='flex items-center text-red-500 hover:text-red-700 focus:outline-none'
					>
						<LogOut className='h-5 w-5 mr-2' />
						Выйти
					</button>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Личные данные */}
				<div className='lg:col-span-1'>
					<div className='bg-white p-6 rounded-lg shadow-md'>
						<h2 className='text-xl font-bold mb-4'>Личные данные</h2>
						{isEditing ? (
							<form onSubmit={handleUpdateProfile}>
								<div className='mb-4'>
									<label htmlFor='name' className='block text-gray-700 mb-1'>
										Имя
									</label>
									<Input
										id='name'
										type='text'
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										placeholder='Введите ваше имя'
									/>
								</div>
								<div className='mb-4'>
									<label htmlFor='email' className='block text-gray-700 mb-1'>
										Email
									</label>
									<Input id='email' type='email' value={session?.user?.email || ""} disabled className='bg-gray-100' />
									<p className='text-xs text-gray-500 mt-1'>Email нельзя изменить</p>
								</div>
								{error && <p className='text-red-500 text-sm mb-4'>{error}</p>}
								<div className='flex justify-end space-x-3'>
									<Button
										type='button'
										variant='outline'
										onClick={() => {
											setIsEditing(false);
											setName(displayName);
											setError(null);
										}}
									>
										Отменить
									</Button>
									<Button type='submit' isLoading={isLoading}>
										Сохранить
									</Button>
								</div>
							</form>
						) : (
							<div>
								<div className='mb-6'>
									<p className='text-gray-600 mb-1'>Имя</p>
									<p className='font-semibold'>{displayName}</p>
								</div>
								<div className='mb-6'>
									<p className='text-gray-600 mb-1'>Email</p>
									<p className='font-semibold'>{session?.user?.email}</p>
								</div>
								<div className='flex justify-end'>
									<Button type='button' onClick={() => setIsEditing(true)}>
										Редактировать
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Заказы пользователя */}
				<div className='lg:col-span-2'>
					<div className='bg-white p-6 rounded-lg shadow-md'>
						<h2 className='text-xl font-bold mb-4 flex items-center'>
							<Package className='h-5 w-5 mr-2' />
							Мои заказы
						</h2>
						<OrdersList limit={3} />
					</div>
				</div>
			</div>
		</div>
	);
});

export default ProfilePage;
