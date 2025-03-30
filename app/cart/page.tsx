"use client";

import { useCart } from "@/app/contexts/CartContext";
import CartItem from "@/app/components/cart/CartItem";
import Button from "@/app/components/shared/Button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import EmptyCart from "@/app/components/cart/EmptyCart";

export default function CartPage() {
	const { items, totalPrice, clearCart, itemCount, totalPriceWithoutDiscount, totalDiscount, isLoading } = useCart();
	const router = useRouter();
	const { data: session } = useSession();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Форматирование цены
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
		}).format(price);
	};

	// Обработка оформления заказа
	const handleCheckout = async () => {
		// Проверяем авторизацию
		if (!session) {
			// Если пользователь не авторизован, перенаправляем на страницу входа
			toast.error("Для оформления заказа необходимо войти в аккаунт");
			router.push("/auth/signin?redirect=/cart");
			return;
		}

		try {
			setIsSubmitting(true);

			// Отправляем заказ на сервер
			const response = await fetch("/api/orders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					items,
					totalAmount: totalPrice,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Ошибка при оформлении заказа");
			}

			const order = await response.json();

			// Очищаем корзину
			clearCart();

			// Перенаправляем на страницу успешного оформления заказа
			router.push(`/checkout/success?orderId=${order.id}`);
		} catch (error) {
			console.error("Ошибка при оформлении заказа:", error);
			toast.error(error instanceof Error ? error.message : "Произошла ошибка при оформлении заказа");
			setIsSubmitting(false);
		}
	};

	// Если корзина пуста, показываем соответствующее сообщение
	if (isLoading) {
		return (
			<div className='container mx-auto px-[25px] lg:px-[50px] py-16'>
				<div className='max-w-3xl mx-auto text-center'>
					<div className='flex justify-center items-center py-20'>
						<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
					</div>
					<p className='text-gray-600'>Загрузка содержимого корзины...</p>
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return <EmptyCart />;
	}

	return (
		<div className='container mx-auto px-[25px] lg:px-[50px] py-12'>
			<div className='flex justify-between items-center mb-8'>
				<h1 className='text-3xl font-bold'>Корзина</h1>
				<Link href='/products' className='inline-flex items-center text-black mb-0 hover:text-gray-700 hover:underline'>
					<ArrowLeft className='h-4 w-4 mr-2' />
					Продолжить покупки
				</Link>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* Список товаров */}
				<div className='lg:col-span-2'>
					{items.map((item) => (
						<CartItem
							key={`${item.product.id}_${item.product.selectedSize || "default"}`}
							product={item.product}
							quantity={item.quantity}
						/>
					))}

					<div className='mt-4 flex justify-end'>
						<Button variant='outline' onClick={clearCart} className='text-red-500 border-red-500 hover:bg-red-50'>
							Очистить корзину
						</Button>
					</div>
				</div>

				{/* Итоговая информация */}
				<div className='lg:col-span-1'>
					<div className='bg-white p-6 rounded-lg shadow-md'>
						<h2 className='text-xl font-bold mb-4'>Оформление заказа</h2>

						<div className='border-t border-b border-gray-200 py-4 mb-4'>
							<div className='flex justify-between mb-2'>
								<span className='text-gray-600'>Товары ({itemCount}):</span>
								<span>{formatPrice(totalPriceWithoutDiscount)}</span>
							</div>
							{totalDiscount > 0 && (
								<div className='flex justify-between mb-2 text-red-500'>
									<span>Скидка:</span>
									<span>-{formatPrice(totalDiscount)}</span>
								</div>
							)}
							<div className='flex justify-between mb-2'>
								<span className='text-gray-600'>Доставка:</span>
								<span>Бесплатно</span>
							</div>
						</div>

						<div className='flex justify-between items-center mb-6'>
							<span className='font-bold'>Итого:</span>
							<span className='text-2xl font-bold'>{formatPrice(totalPrice)}</span>
						</div>

						<Button fullWidth size='lg' onClick={handleCheckout} isLoading={isSubmitting}>
							Оформить заказ
						</Button>

						<p className='text-sm text-gray-500 mt-4 text-center'>
							Нажимая кнопку &quot;Оформить заказ&quot;, вы соглашаетесь с условиями покупки
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
