"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRu } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, Package, Truck, Eye } from "lucide-react";
import Button from "@/app/components/shared/Button";
import { OrderStatus } from "@prisma/client";
import FilterSortPanel from "@/app/components/admin/FilterSortPanel";
import { sortItems, parseSortString, generateSortOptions } from "@/app/lib/admin/sortUtils";

interface Order {
	id: string;
	status: OrderStatus;
	total: number;
	createdAt: string;
	updatedAt: string;
	user: {
		id: string;
		name: string;
		email: string;
	};
	items: {
		id: string;
		quantity: number;
		price: number;
		size: string | null;
		product: {
			id: string;
			brandName: string;
			model: string;
			image: string;
		};
	}[];
}

export default function OrdersAdminPage() {
	const [orders, setOrders] = useState<Order[]>([]);
	const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filter, setFilter] = useState("all");
	const [sortOrder, setSortOrder] = useState("");

	const fetchOrders = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/admin/orders");

			if (!response.ok) {
				throw new Error("Не удалось загрузить заказы");
			}

			const data = await response.json();
			setOrders(data);
			setFilteredOrders(data);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	useEffect(() => {
		let result = [...orders];

		// Применяем фильтр по статусу
		if (filter !== "all") {
			result = result.filter((order) => order.status === filter);
		}

		// Применяем поиск
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(order) =>
					order.id.toLowerCase().includes(term) ||
					order.user.email.toLowerCase().includes(term) ||
					(order.user.name && order.user.name.toLowerCase().includes(term))
			);
		}

		// Применяем сортировку
		if (sortOrder) {
			const [sortKey, sortDirection] = parseSortString(sortOrder);
			if (sortKey) {
				result = sortItems(result, sortKey, sortDirection);
			}
		}

		setFilteredOrders(result);
	}, [filter, searchTerm, sortOrder, orders]);

	const getStatusName = (status: OrderStatus) => {
		switch (status) {
			case OrderStatus.DELIVERED:
				return "Доставлен";
			case OrderStatus.ACCEPTED:
				return "Подтвержден";
			case OrderStatus.PROCESSING:
				return "В обработке";
			case OrderStatus.CANCELLED:
				return "Отменен";
			case OrderStatus.SHIPPED:
				return "Доставляется";
			default:
				return "Новый";
		}
	};

	const getStatusIcon = (status: OrderStatus) => {
		switch (status) {
			case OrderStatus.DELIVERED:
				return <CheckCircle className='h-5 w-5 text-green-500' />;
			case OrderStatus.PROCESSING:
				return <Clock className='h-5 w-5 text-yellow-500' />;
			case OrderStatus.CANCELLED:
				return <XCircle className='h-5 w-5 text-red-500' />;
			case OrderStatus.SHIPPED:
				return <Truck className='h-5 w-5 text-blue-500' />;
			case OrderStatus.ACCEPTED:
				return <CheckCircle className='h-5 w-5 text-blue-500' />;
			default:
				return <Package className='h-5 w-5 text-gray-500' />;
		}
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat("ru-RU", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	// Обработчики для компонента FilterSortPanel
	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleFilterChange = (status: string) => {
		setFilter(status);
	};

	const handleSortChange = (sort: string) => {
		setSortOrder(sort);
	};

	// Опции сортировки
	const sortOptions = generateSortOptions([
		{ key: "createdAt", label: "Дата" },
		{ key: "total", label: "Сумма" },
	]);

	// Опции фильтра - строковые значения вместо перечисления для единообразия
	const filterOptions = [
		{ id: "all", name: "Все статусы" },
		{ id: OrderStatus.PROCESSING, name: "В обработке" },
		{ id: OrderStatus.ACCEPTED, name: "Подтверждены" },
		{ id: OrderStatus.SHIPPED, name: "Доставляются" },
		{ id: OrderStatus.DELIVERED, name: "Доставлены" },
		{ id: OrderStatus.CANCELLED, name: "Отменены" },
	];

	if (isLoading) {
		return (
			<div>
				<h1 className='text-2xl font-bold mb-6'>Управление заказами</h1>
				<div className='flex justify-center'>
					<div className='animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900'></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<h1 className='text-2xl font-bold mb-6'>Управление заказами</h1>
				<div className='bg-red-100 p-4 rounded-md'>
					<p className='text-red-700'>{error}</p>
					<button onClick={fetchOrders} className='mt-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700'>
						Попробовать снова
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<h1 className='text-2xl font-bold mb-6'>Управление заказами</h1>

			{/* Использование компонента FilterSortPanel */}
			<FilterSortPanel
				onSearch={handleSearch}
				onFilterChange={handleFilterChange}
				onSortChange={handleSortChange}
				searchPlaceholder='Поиск по ID заказа или email пользователя'
				filterOptions={filterOptions}
				sortOptions={sortOptions}
				initialSearchTerm={searchTerm}
				initialFilterValue={filter}
				initialSortValue={sortOrder}
				totalItems={filteredOrders.length}
				itemsLabel='Всего заказов'
				icon={<Package className='h-4 w-4' />}
				showSort={true}
				showFilter={true}
				showTotalItems={true}
			/>

			{/* Таблица заказов */}
			{filteredOrders.length > 0 ? (
				<div className='bg-white rounded-md shadow overflow-hidden'>
					<div className='overflow-x-auto'>
						<table className='min-w-full divide-y divide-gray-200'>
							<thead className='bg-gray-50'>
								<tr>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										ID заказа
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Пользователь
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Дата
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Сумма
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Статус
									</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Действия
									</th>
								</tr>
							</thead>
							<tbody className='bg-white divide-y divide-gray-200'>
								{filteredOrders.map((order) => (
									<tr key={order.id} className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
											{order.id.substring(0, 8)}...
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											<div>{order.user.name || "Нет имени"}</div>
											<div className='text-xs'>{order.user.email}</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatDate(order.createdAt)}</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
											{formatRu(order.total)} ₽
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center'>
												{getStatusIcon(order.status)}
												<span className='ml-2 text-sm text-gray-700'>{getStatusName(order.status)}</span>
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											<Link href={`/admin/orders/${order.id}`}>
												<Button variant='outline' size='sm'>
													<Eye className='h-3 w-3 mr-1' />
													Подробнее
												</Button>
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			) : (
				<div className='bg-white rounded-lg shadow p-8 text-center'>
					<p className='text-xl text-gray-600 mb-4'>Заказы не найдены</p>
					<p className='text-gray-500'>Попробуйте изменить параметры поиска или фильтра</p>
				</div>
			)}
		</div>
	);
}
