"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Package, CheckCircle, XCircle, Clock, Truck, AlertTriangle } from "lucide-react";
import React from "react";
import { OrderStatus } from "@prisma/client";

interface OrderItem {
	id: string;
	productId: string;
	price: number;
	quantity: number;
	size: string | null;
	product: {
		id: string;
		model: string;
		brandName: string;
		image: string;
	};
}

interface Order {
	id: string;
	userId: string;
	status: OrderStatus;
	total: number;
	createdAt: string;
	updatedAt: string;
	items: OrderItem[];
}

// Функции для работы со статусами заказа
const getStatusIcon = (status: OrderStatus) => {
	switch (status) {
		case OrderStatus.PROCESSING:
			return <Clock className='h-6 w-6 text-yellow-500' />;
		case OrderStatus.ACCEPTED:
			return <CheckCircle className='h-6 w-6 text-blue-500' />;
		case OrderStatus.SHIPPED:
			return <Truck className='h-6 w-6 text-blue-500' />;
		case OrderStatus.DELIVERED:
			return <CheckCircle className='h-6 w-6 text-green-500' />;
		case OrderStatus.CANCELLED:
			return <XCircle className='h-6 w-6 text-red-500' />;
		default:
			return <Package className='h-6 w-6 text-gray-500' />;
	}
};

const getStatusName = (status: OrderStatus) => {
	switch (status) {
		case OrderStatus.ACCEPTED:
			return "Подтвержден";
		case OrderStatus.PROCESSING:
			return "В обработке";
		case OrderStatus.CANCELLED:
			return "Отменен";
		case OrderStatus.SHIPPED:
			return "Доставляется";
		case OrderStatus.DELIVERED:
			return "Доставлен";
		default:
			return "Новый";
	}
};

export default function OrderDetailsPage() {
	const [order, setOrder] = useState<Order | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isCancelling, setIsCancelling] = useState<boolean>(false);
	const [confirmCancelModal, setConfirmCancelModal] = useState<boolean>(false);
	const [cancelError, setCancelError] = useState<string | null>(null);
	const router = useRouter();
	const params = useParams();

	// Получаем id из хука useParams
	const id = params.id as string;

	useEffect(() => {
		async function fetchOrderDetails() {
			try {
				const response = await fetch(`/api/user/orders/${id}`);

				if (!response.ok) {
					if (response.status === 404) {
						router.push("/profile");
						return;
					}
					throw new Error("Не удалось загрузить данные заказа");
				}

				const data = await response.json();
				setOrder(data);
			} catch (error) {
				setError("Произошла ошибка при загрузке данных заказа");
				console.error("Error fetching order details:", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchOrderDetails();
	}, [id, router]);

	// Функция для форматирования цены
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
		}).format(price);
	};

	// Функция для проверки возможности отмены заказа
	const canCancelOrder = (status: OrderStatus) => {
		return status === OrderStatus.PROCESSING || status === OrderStatus.ACCEPTED;
	};

	// Функция для отмены заказа
	const cancelOrder = async () => {
		if (!order) return;

		setIsCancelling(true);
		setCancelError(null);

		try {
			const response = await fetch(`/api/user/orders/${id}`, {
				method: "PATCH",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Не удалось отменить заказ");
			}

			const updatedOrder = await response.json();
			setOrder(updatedOrder);
			setConfirmCancelModal(false);
		} catch (error) {
			setCancelError((error as Error).message);
		} finally {
			setIsCancelling(false);
		}
	};

	if (isLoading) {
		return (
			<div className='container mx-auto px-[25px] lg:px-[50px] py-8 mt-8'>
				<div className='flex justify-center items-center py-12'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
				</div>
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className='container mx-auto px-[25px] lg:px-[50px] py-8 mt-8'>
				<div className='bg-red-50 p-6 rounded-md text-red-700'>
					<p className='font-medium'>Ошибка загрузки заказа</p>
					<p>{error || "Заказ не найден"}</p>
					<Link
						href='/profile'
						className='mt-4 inline-flex items-center text-black hover:text-gray-700 hover:underline'
					>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Вернуться в профиль
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-[25px] lg:px-[50px] py-8 mt-8'>
			<Link
				href='/profile/orders'
				className='inline-flex items-center text-black mb-6 hover:text-gray-700 hover:underline'
			>
				<ArrowLeft className='h-4 w-4 mr-2' />
				Вернуться к списку заказов
			</Link>

			<h1 className='text-2xl font-bold mb-6'>Заказ #{order.id.substring(0, 8)}</h1>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{/* Список товаров */}
				<div className='lg:col-span-2'>
					<div className='bg-white rounded-lg shadow-md overflow-hidden'>
						<div className='p-4 border-b border-gray-200 flex items-center justify-between'>
							<h2 className='font-semibold'>Товары в заказе</h2>
							<div className='flex items-center'>
								{getStatusIcon(order.status)}
								<span className='ml-2 font-medium'>{getStatusName(order.status)}</span>
							</div>
						</div>

						<div className='divide-y divide-gray-200'>
							{order.items.map((item) => (
								<div key={item.id} className='p-4 flex'>
									{/* Изображение товара */}
									<div className='w-16 h-16 bg-gray-100 flex items-center justify-center rounded-md mr-4 flex-shrink-0'>
										{item.product.image ? (
											<Image
												src={item.product.image}
												alt={item.product.model}
												width={56}
												height={56}
												className='object-contain'
											/>
										) : (
											<Package className='h-6 w-6 text-gray-400' />
										)}
									</div>

									{/* Информация о товаре */}
									<div className='flex-1'>
										<Link href={`/products/${item.productId}`} className='block hover:opacity-80 transition-opacity'>
											<p className='font-medium text-sm'>
												{item.product.brandName} {item.product.model}
											</p>
											{item.size && <p className='text-sm text-gray-600'>Размер: {item.size}</p>}
										</Link>
										<div className='mt-1 flex justify-between'>
											<p className='text-sm text-gray-500'>{item.quantity} шт.</p>
											<p className='font-semibold'>{formatPrice(item.price * item.quantity)}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Детали заказа */}
				<div className='lg:col-span-1'>
					<div className='bg-white rounded-lg shadow-md overflow-hidden p-4'>
						<h2 className='font-semibold mb-4'>Детали заказа</h2>

						<div className='space-y-3'>
							<div className='flex justify-between'>
								<span className='text-gray-600'>Дата заказа:</span>
								<span>{format(new Date(order.createdAt), "dd.MM.yyyy HH:mm")}</span>
							</div>

							<div className='flex justify-between'>
								<span className='text-gray-600'>Последнее обновление:</span>
								<span>
									{formatDistanceToNow(new Date(order.updatedAt || order.createdAt), { locale: ru, addSuffix: true })}
								</span>
							</div>

							<div className='flex justify-between border-t border-gray-200 pt-3 mt-3'>
								<span className='text-gray-600'>Количество товаров:</span>
								<span>{order.items.reduce((acc, item) => acc + item.quantity, 0)} шт.</span>
							</div>

							<div className='flex justify-between'>
								<span className='text-gray-600'>Стоимость товаров:</span>
								<span>{formatPrice(order.total)}</span>
							</div>

							<div className='flex justify-between'>
								<span className='text-gray-600'>Доставка:</span>
								<span>Бесплатно</span>
							</div>

							<div className='flex justify-between border-t border-gray-200 pt-3 mt-3'>
								<span className='text-gray-700 font-semibold'>Итого:</span>
								<span className='font-bold text-lg'>{formatPrice(order.total)}</span>
							</div>

							{canCancelOrder(order.status) && (
								<div className='mt-4 pt-3 border-t border-gray-200'>
									<button
										onClick={() => setConfirmCancelModal(true)}
										className='w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center'
									>
										<XCircle className='h-4 w-4 mr-2' />
										Отменить заказ
									</button>
								</div>
							)}

							{cancelError && <div className='mt-3 p-3 bg-red-50 text-red-700 rounded-md text-sm'>{cancelError}</div>}
						</div>
					</div>
				</div>
			</div>

			{/* Модальное окно подтверждения отмены */}
			{confirmCancelModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-lg shadow-xl max-w-md w-full p-6'>
						<div className='flex items-center mb-4 text-red-600'>
							<AlertTriangle className='h-6 w-6 mr-2' />
							<h3 className='text-lg font-bold'>Подтверждение отмены</h3>
						</div>

						<p className='mb-6'>Вы уверены, что хотите отменить заказ? Это действие невозможно отменить.</p>

						<div className='flex justify-end space-x-3'>
							<button
								onClick={() => setConfirmCancelModal(false)}
								className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
								disabled={isCancelling}
							>
								Отмена
							</button>
							<button
								onClick={cancelOrder}
								className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center'
								disabled={isCancelling}
							>
								{isCancelling ? (
									<>
										<div className='animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2'></div>
										Отмена заказа...
									</>
								) : (
									"Да, отменить заказ"
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
