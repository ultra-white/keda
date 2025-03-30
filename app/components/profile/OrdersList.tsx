"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight, Package, CheckCircle, Clock, XCircle, ShoppingBag, Truck } from "lucide-react";
import { OrderStatus } from "@prisma/client";

type OrderItem = {
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
};

type Order = {
	id: string;
	userId: string;
	status: OrderStatus;
	total: number;
	createdAt: string;
	items: OrderItem[];
};

const formatPrice = (price: number) => {
	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: "RUB",
		minimumFractionDigits: 0,
	}).format(price);
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

interface OrdersListProps {
	limit?: number;
}

export default function OrdersList({ limit }: OrdersListProps) {
	const [orders, setOrders] = useState<Order[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchOrders = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/user/orders");
				if (!response.ok) {
					throw new Error("Не удалось загрузить заказы");
				}
				const data = await response.json();
				setOrders(data);
			} catch (err) {
				setError((err as Error).message);
			} finally {
				setIsLoading(false);
			}
		};

		fetchOrders();
	}, []);

	const displayOrders = limit ? orders.slice(0, limit) : orders;
	const hasMoreOrders = limit && orders.length > limit;

	if (isLoading) {
		return (
			<div className='flex justify-center items-center p-8'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-red-50 p-4 rounded-md text-center'>
				<p className='text-red-700'>{error}</p>
			</div>
		);
	}

	if (orders.length === 0) {
		return (
			<div className='text-center py-8'>
				<ShoppingBag className='mx-auto h-12 w-12 text-gray-400 mb-4' />
				<h3 className='text-lg font-medium text-gray-900 mb-2'>У вас пока нет заказов</h3>
				<p className='text-gray-500 mb-4'>Найдите что-нибудь в нашем каталоге и сделайте первый заказ</p>
				<Link href='/' className='inline-flex items-center text-black mb-0 hover:text-gray-700 hover:underline'>
					Перейти в каталог
					<ArrowRight className='ml-2 h-4 w-4' />
				</Link>
			</div>
		);
	}

	return (
		<div>
			<div className='space-y-6'>
				{displayOrders.map((order) => (
					<div key={order.id} className='border rounded-lg overflow-hidden'>
						<div className='bg-gray-50 p-4 flex justify-between items-center'>
							<div>
								<p className='text-sm text-gray-500'>
									{formatDistanceToNow(new Date(order.createdAt), {
										addSuffix: true,
										locale: ru,
									})}
								</p>
								<p className='font-medium'>Заказ #{order.id.substring(0, 8)}</p>
							</div>
							<div className='flex items-center'>
								{getStatusIcon(order.status)}
								<span className='ml-2 text-sm'>{getStatusName(order.status)}</span>
							</div>
						</div>
						<div className='p-4'>
							<div className='space-y-2 mb-4'>
								{order.items.slice(0, 2).map((item) => (
									<div key={item.id} className='flex justify-between items-center'>
										<div className='flex items-center'>
											<div className='w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3'>
												{item.product?.image ? (
													<Image
														src={item.product.image}
														alt={`${item.product.brandName} ${item.product.model}`}
														width={32}
														height={32}
														className='object-contain'
													/>
												) : (
													<Package className='h-5 w-5 text-gray-400' />
												)}
											</div>
											<div>
												<p className='text-sm font-medium'>
													{item.product.brandName} {item.product.model}
												</p>
												<p className='text-xs text-gray-500'>
													{item.size ? `Размер: ${item.size}, ` : ""}Кол-во: {item.quantity}
												</p>
											</div>
										</div>
										<p className='text-sm font-medium'>{formatPrice(item.price * item.quantity)}</p>
									</div>
								))}

								{order.items.length > 2 && (
									<p className='text-sm text-gray-500 italic'>
										и еще {order.items.length - 2}{" "}
										{order.items.length - 2 === 1 ? "товар" : order.items.length - 2 < 5 ? "товара" : "товаров"}
									</p>
								)}
							</div>

							<div className='flex justify-between items-center border-t pt-3'>
								<p className='font-medium'>Итого:</p>
								<p className='font-bold'>{formatPrice(order.total)}</p>
							</div>

							<div className='flex justify-end mt-3'>
								<Link
									href={`/profile/orders/${order.id}`}
									className='inline-flex items-center text-black hover:text-gray-700 hover:underline text-sm'
								>
									Подробнее
									<ArrowRight className='ml-1 h-3 w-3' />
								</Link>
							</div>
						</div>
					</div>
				))}
			</div>

			{hasMoreOrders && (
				<div className='mt-6 text-center'>
					<Link
						href='/profile/orders'
						className='inline-flex items-center text-black hover:text-gray-700 hover:underline'
					>
						Просмотреть все заказы ({orders.length})
						<ArrowRight className='ml-2 h-4 w-4' />
					</Link>
				</div>
			)}
		</div>
	);
}
