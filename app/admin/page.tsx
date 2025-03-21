"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Folder, Users, Package } from "lucide-react";

interface DashboardStats {
	productsCount: number;
	categoriesCount: number;
	usersCount: number;
	ordersCount: number;
}

export default function AdminPage() {
	const [stats, setStats] = useState<DashboardStats>({
		productsCount: 0,
		categoriesCount: 0,
		usersCount: 0,
		ordersCount: 0,
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				// Получение количества товаров
				const productsRes = await fetch("/api/admin/products");
				const products = await productsRes.json();

				// Получение количества категорий
				const categoriesRes = await fetch("/api/admin/categories");
				const categories = await categoriesRes.json();

				// Получение количества пользователей
				const usersRes = await fetch("/api/admin/users");
				const users = await usersRes.json();

				// Получение количества заказов
				const ordersRes = await fetch("/api/admin/orders");
				const orders = await ordersRes.json();

				setStats({
					productsCount: Array.isArray(products) ? products.length : 0,
					categoriesCount: Array.isArray(categories) ? categories.length : 0,
					usersCount: Array.isArray(users) ? users.length : 0,
					ordersCount: Array.isArray(orders) ? orders.length : 0,
				});
			} catch (error) {
				console.error("Ошибка при загрузке статистики:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, []);

	if (isLoading) {
		return <div className='flex items-center justify-center p-8'>Загрузка статистики...</div>;
	}

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
			{/* Карточка товаров */}
			<div className='bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200'>
				<div className='p-5'>
					<div className='flex items-center'>
						<div className='flex-shrink-0 bg-indigo-100 rounded-md p-3'>
							<ShoppingBag className='h-6 w-6 text-indigo-600' />
						</div>
						<div className='ml-5'>
							<h3 className='text-lg font-medium text-gray-900'>Товары</h3>
							<div className='mt-1 text-3xl font-semibold text-gray-700'>{stats.productsCount}</div>
						</div>
					</div>
					<div className='mt-4'>
						<Link href='/admin/products' className='text-sm font-medium text-indigo-600 hover:text-indigo-800'>
							Перейти к управлению товарами →
						</Link>
					</div>
				</div>
			</div>

			{/* Карточка категорий */}
			<div className='bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200'>
				<div className='p-5'>
					<div className='flex items-center'>
						<div className='flex-shrink-0 bg-green-100 rounded-md p-3'>
							<Folder className='h-6 w-6 text-green-600' />
						</div>
						<div className='ml-5'>
							<h3 className='text-lg font-medium text-gray-900'>Категории</h3>
							<div className='mt-1 text-3xl font-semibold text-gray-700'>{stats.categoriesCount}</div>
						</div>
					</div>
					<div className='mt-4'>
						<Link href='/admin/categories' className='text-sm font-medium text-green-600 hover:text-green-800'>
							Перейти к управлению категориями →
						</Link>
					</div>
				</div>
			</div>

			{/* Карточка пользователей */}
			<div className='bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200'>
				<div className='p-5'>
					<div className='flex items-center'>
						<div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
							<Users className='h-6 w-6 text-blue-600' />
						</div>
						<div className='ml-5'>
							<h3 className='text-lg font-medium text-gray-900'>Пользователи</h3>
							<div className='mt-1 text-3xl font-semibold text-gray-700'>{stats.usersCount}</div>
						</div>
					</div>
					<div className='mt-4'>
						<Link href='/admin/users' className='text-sm font-medium text-blue-600 hover:text-blue-800'>
							Перейти к управлению пользователями →
						</Link>
					</div>
				</div>
			</div>

			{/* Карточка заказов */}
			<div className='bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200'>
				<div className='p-5'>
					<div className='flex items-center'>
						<div className='flex-shrink-0 bg-orange-100 rounded-md p-3'>
							<Package className='h-6 w-6 text-orange-600' />
						</div>
						<div className='ml-5'>
							<h3 className='text-lg font-medium text-gray-900'>Заказы</h3>
							<div className='mt-1 text-3xl font-semibold text-gray-700'>{stats.ordersCount}</div>
						</div>
					</div>
					<div className='mt-4'>
						<Link href='/admin/orders' className='text-sm font-medium text-orange-600 hover:text-orange-800'>
							Перейти к управлению заказами →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
