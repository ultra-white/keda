"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { formatRu } from "@/lib/utils";
import React from "react";
import Button from "@/app/components/shared/Button";
import { OrderStatus } from "@prisma/client";
import {
	ChevronLeft,
	CheckCircle,
	Clock,
	XCircle,
	Package,
	Truck,
	User,
	ShoppingBag,
	Calendar,
	CreditCard,
	AlertTriangle,
	Trash2,
} from "lucide-react";

interface Product {
	id: string;
	brandName: string;
	model: string;
	image: string;
}

interface OrderItem {
	id: string;
	quantity: number;
	price: number;
	size: string | null;
	product: Product;
}

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
	items: OrderItem[];
}

export default function OrderDetailsPage() {
	const params = useParams();
	const orderId = params.id as string;

	const router = useRouter();
	const [order, setOrder] = useState<Order | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null);
	const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(OrderStatus.PROCESSING);
	const [updateMessage, setUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	useEffect(() => {
		const fetchOrderDetails = async () => {
			try {
				setIsLoading(true);
				const response = await fetch(`/api/admin/orders/${orderId}`);

				if (!response.ok) {
					throw new Error("Не удалось загрузить информацию о заказе");
				}

				const data = await response.json();
				setOrder(data);
				setSelectedStatus(data.status as OrderStatus);
			} catch (err) {
				setError((err as Error).message);
			} finally {
				setIsLoading(false);
			}
		};

		if (orderId) {
			fetchOrderDetails();
		}
	}, [orderId]);

	const handleStatusUpdate = async () => {
		if (!order || selectedStatus === order.status) return;

		try {
			setIsUpdating(true);
			const response = await fetch(`/api/admin/orders/${orderId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: selectedStatus }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Не удалось обновить статус заказа");
			}

			const updatedOrder = await response.json();
			setOrder(updatedOrder);
			setSelectedStatus(updatedOrder.status as OrderStatus);
			setUpdateMessage({
				type: "success",
				text: "Статус заказа успешно обновлен",
			});

			// Скрываем сообщение через 3 секунды
			setTimeout(() => setUpdateMessage(null), 3000);
		} catch (err) {
			setUpdateMessage({
				type: "error",
				text: (err as Error).message,
			});
			setTimeout(() => setUpdateMessage(null), 3000);
		} finally {
			setIsUpdating(false);
		}
	};

	const deleteOrder = async () => {
		if (!order) return;

		try {
			setIsDeleting(true);
			const response = await fetch(`/api/admin/orders/${orderId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Не удалось удалить заказ");
			}

			setUpdateMessage({
				type: "success",
				text: "Заказ успешно удален",
			});

			// Перенаправляем на страницу со списком заказов через 1 секунду
			setTimeout(() => {
				router.push("/admin/orders");
			}, 1000);
		} catch (err) {
			setUpdateMessage({
				type: "error",
				text: (err as Error).message,
			});
			setIsDeleteModalOpen(false);
		} finally {
			setIsDeleting(false);
		}
	};

	const deleteOrderItem = async (itemId: string) => {
		if (!order) return;

		try {
			setIsDeletingItem(itemId);
			const response = await fetch(`/api/admin/orders/${orderId}/items/${itemId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Не удалось удалить товар из заказа");
			}

			const updatedOrder = await response.json();
			setOrder(updatedOrder);
			setUpdateMessage({
				type: "success",
				text: "Товар успешно удален из заказа",
			});

			setTimeout(() => setUpdateMessage(null), 3000);
		} catch (err) {
			setUpdateMessage({
				type: "error",
				text: (err as Error).message,
			});
			setTimeout(() => setUpdateMessage(null), 3000);
		} finally {
			setIsDeletingItem(null);
		}
	};

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

	if (isLoading) {
		return (
			<div className='p-8'>
				<div className='flex justify-center'>
					<div className='animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900'></div>
				</div>
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className='p-8'>
				<div className='bg-red-100 p-4 rounded-md'>
					<p className='text-red-700'>{error || "Заказ не найден"}</p>
					<button
						onClick={() => router.push("/admin/orders")}
						className='mt-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700'
					>
						Вернуться к списку заказов
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Навигация */}
			<div className='mb-6'>
				<Link href='/admin/orders' className='inline-flex items-center text-gray-600 hover:text-gray-900'>
					<ChevronLeft className='w-4 h-4 mr-1' />
					Назад к списку заказов
				</Link>
			</div>

			{/* Шапка заказа */}
			<div className='bg-white rounded-lg shadow-sm p-6 mb-6'>
				<div className='flex flex-col md:flex-row md:items-center justify-between mb-4'>
					<div>
						<h1 className='text-xl font-bold'>Заказ #{order.id.substring(0, 8)}</h1>
						<p className='text-gray-500 flex items-center mt-1'>
							<Calendar className='w-4 h-4 mr-1' />
							{formatDate(order.createdAt)}
						</p>
					</div>

					<div className='flex items-center gap-2 mt-2 md:mt-0'>
						{updateMessage && (
							<div
								className={`px-4 py-2 rounded-md ${
									updateMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
								} text-sm`}
							>
								{updateMessage.type === "success" ? (
									<div className='flex items-center'>
										<CheckCircle className='w-4 h-4 mr-1' />
										{updateMessage.text}
									</div>
								) : (
									<div className='flex items-center'>
										<AlertTriangle className='w-4 h-4 mr-1' />
										{updateMessage.text}
									</div>
								)}
							</div>
						)}

						<Button variant='danger' onClick={() => setIsDeleteModalOpen(true)} className='flex items-center'>
							<Trash2 className='w-4 h-4 mr-2' />
							Удалить заказ
						</Button>
					</div>
				</div>

				<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
					{/* Информация о покупателе */}
					<div className='bg-gray-50 p-4 rounded-md'>
						<h2 className='font-medium flex items-center text-gray-700 mb-3'>
							<User className='w-4 h-4 mr-2' />
							Информация о покупателе
						</h2>
						<p className='text-sm font-medium'>{order.user.name || "Имя не указано"}</p>
						<p className='text-sm text-gray-600'>{order.user.email}</p>
					</div>

					{/* Информация о заказе */}
					<div className='bg-gray-50 p-4 rounded-md'>
						<h2 className='font-medium flex items-center text-gray-700 mb-3'>
							<ShoppingBag className='w-4 h-4 mr-2' />
							Информация о заказе
						</h2>
						<p className='text-sm'>
							<span className='font-medium'>Количество товаров:</span>{" "}
							{order.items.reduce((acc, item) => acc + item.quantity, 0)}
						</p>
						<p className='text-sm'>
							<span className='font-medium'>Количество позиций:</span> {order.items.length}
						</p>
					</div>

					{/* Информация об оплате */}
					<div className='bg-gray-50 p-4 rounded-md'>
						<h2 className='font-medium flex items-center text-gray-700 mb-3'>
							<CreditCard className='w-4 h-4 mr-2' />
							Информация об оплате
						</h2>
						<p className='text-sm font-medium'>Сумма заказа: {formatRu(order.total)} ₽</p>
					</div>
				</div>

				{/* Статус заказа */}
				<div className='mt-6 border-t border-gray-100 pt-6'>
					<h2 className='font-medium mb-3'>Статус заказа</h2>
					<div className='flex flex-wrap items-center gap-4'>
						<div className='flex items-center'>
							{getStatusIcon(order.status)}
							<span className='ml-2 text-sm'>{getStatusName(order.status)}</span>
						</div>

						<div className='flex-1 min-w-[300px]'>
							<div className='flex items-center gap-2'>
								<select
									value={selectedStatus}
									onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
									className='border border-gray-300 rounded-md p-2 text-sm flex-1'
									disabled={isUpdating}
								>
									<option value={OrderStatus.PROCESSING}>В обработке</option>
									<option value={OrderStatus.ACCEPTED}>Подтвержден</option>
									<option value={OrderStatus.SHIPPED}>Доставляется</option>
									<option value={OrderStatus.DELIVERED}>Доставлен</option>
									<option value={OrderStatus.CANCELLED}>Отменен</option>
								</select>

								<Button
									variant='primary'
									onClick={handleStatusUpdate}
									disabled={isUpdating || order.status === selectedStatus}
									isLoading={isUpdating}
								>
									Обновить статус
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Содержимое заказа */}
			<div className='bg-white rounded-lg shadow-sm p-6'>
				<h2 className='font-bold text-lg mb-4'>Содержимое заказа</h2>

				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Товар
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Цена</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Кол-во
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Размер
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Итого
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Действия
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{order.items.map((item) => (
								<tr key={item.id}>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex items-center'>
											<div className='flex-shrink-0 h-10 w-10 relative'>
												<Image
													src={item.product.image}
													alt={`${item.product.brandName} ${item.product.model}`}
													className='object-cover rounded-md'
													fill
													sizes='40px'
												/>
											</div>
											<div className='ml-4'>
												<div className='text-sm font-medium text-gray-900'>
													{item.product.brandName} {item.product.model}
												</div>
											</div>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatRu(item.price)} ₽</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity}</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.size || "Не указан"}</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
										{formatRu(item.price * item.quantity)} ₽
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										<Button
											variant='danger'
											size='sm'
											onClick={() => deleteOrderItem(item.id)}
											disabled={isDeletingItem === item.id || order.items.length === 1}
											isLoading={isDeletingItem === item.id}
											title={order.items.length === 1 ? "Нельзя удалить единственный товар в заказе" : "Удалить товар"}
										>
											<Trash2 className='h-3 w-3 mr-1' />
											Удалить
										</Button>
									</td>
								</tr>
							))}

							{/* Итого */}
							<tr className='bg-gray-50'>
								<td colSpan={4} className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right'>
									Итого:
								</td>
								<td className='px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900'>
									{formatRu(order.total)} ₽
								</td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* Модальное окно подтверждения удаления заказа */}
			{isDeleteModalOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div className='bg-white rounded-lg max-w-md w-full p-6'>
						<h3 className='text-lg font-medium text-gray-900 mb-4'>Подтверждение удаления</h3>
						<p className='text-gray-700 mb-4'>
							Вы уверены, что хотите удалить заказ #{order.id.substring(0, 8)}? Это действие нельзя отменить.
						</p>
						<div className='flex justify-end space-x-3'>
							<Button variant='ghost' onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
								Отмена
							</Button>
							<Button variant='danger' onClick={deleteOrder} disabled={isDeleting} isLoading={isDeleting}>
								Удалить
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
