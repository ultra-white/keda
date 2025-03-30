"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Product } from "@/app/components/products/ProductCard";
import { useCart } from "@/app/contexts/CartContext";
import Link from "next/link";
import { useState, useEffect } from "react";

// Расширяем интерфейс Product для соответствия дополнительным свойствам
interface ExtendedProduct extends Product {
	image?: string;
	brand?: { name: string };
	brandName?: string;
	model?: string;
	category?: { name: string };
}

interface CartItemProps {
	product: ExtendedProduct;
	quantity: number;
}

export default function CartItem({ product, quantity }: CartItemProps) {
	const { updateQuantity, removeItem } = useCart();
	const [imageError, setImageError] = useState(false);
	const [localQuantity, setLocalQuantity] = useState(quantity);
	const [isUpdating, setIsUpdating] = useState(false);

	// Синхронизация локального состояния с пропсами
	useEffect(() => {
		setLocalQuantity(quantity);
	}, [quantity]);

	// Проверка является ли строка корректным URL
	const isValidUrl = (urlString: string): boolean => {
		try {
			if (!urlString || typeof urlString !== "string") return false;
			// Если URL не начинается с http:// или https://, считаем его невалидным
			if (!/^https?:\/\//i.test(urlString)) {
				return false;
			}
			new URL(urlString);
			return true;
		} catch {
			return false;
		}
	};

	// Форматирование цены
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("ru-RU", {
			style: "currency",
			currency: "RUB",
			minimumFractionDigits: 0,
		}).format(price);
	};

	// Увеличение количества
	const increaseQuantity = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isUpdating || localQuantity >= 100) return;

		setIsUpdating(true);
		setLocalQuantity((prev) => Math.min(prev + 1, 100));

		try {
			updateQuantity(product.id, localQuantity + 1, product.selectedSize);
		} finally {
			setIsUpdating(false);
		}
	};

	// Уменьшение количества
	const decreaseQuantity = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isUpdating) return;

		setIsUpdating(true);

		try {
			if (localQuantity <= 1) {
				// Если количество равно 1, то удаляем товар
				removeItem(product.id, product.selectedSize);
			} else {
				// Иначе уменьшаем количество
				setLocalQuantity((prev) => prev - 1);
				updateQuantity(product.id, localQuantity - 1, product.selectedSize);
			}
		} finally {
			setIsUpdating(false);
		}
	};

	// Удаление товара
	const handleRemove = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isUpdating) return;

		setIsUpdating(true);

		try {
			removeItem(product.id, product.selectedSize);
		} finally {
			setIsUpdating(false);
		}
	};

	// Обработка ручного ввода количества
	const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// Разрешаем пустое значение при вводе (пользователь может стирать и начинать ввод заново)
		if (value === "") {
			setLocalQuantity(0);
			return;
		}

		const newValue = parseInt(value);

		// Проверяем, что введенное значение - положительное число и не превышает 100
		if (isNaN(newValue) || newValue < 0) {
			return;
		}

		// Ограничиваем максимальное значение до 100
		const limitedValue = Math.min(newValue, 100);

		// Обновляем локальное значение без отправки запроса на сервер (запрос отправится при потере фокуса)
		setLocalQuantity(limitedValue);
	};

	// Обработка потери фокуса и нажатия Enter
	const handleBlur = () => {
		// Если значение не изменилось, не делаем запрос
		if (localQuantity === quantity) {
			return;
		}

		// Если пользователь ввел 0 или пустое значение
		if (localQuantity <= 0) {
			// Удаляем товар, если значение 0
			setIsUpdating(true);
			try {
				removeItem(product.id, product.selectedSize);
			} finally {
				setIsUpdating(false);
			}
			return;
		}

		// Ограничиваем значение до 100
		const limitedValue = Math.min(localQuantity, 100);

		// Если значение было ограничено, обновляем локальное состояние
		if (limitedValue !== localQuantity) {
			setLocalQuantity(limitedValue);
		}

		// Обновляем количество
		setIsUpdating(true);
		try {
			updateQuantity(product.id, limitedValue, product.selectedSize);
		} finally {
			setIsUpdating(false);
		}
	};

	// Обработка нажатия клавиши Enter
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Блокируем ввод ненужных символов (e, +, -, .)
		if (e.key === "e" || e.key === "+" || e.key === "-" || e.key === ".") {
			e.preventDefault();
			return;
		}

		// При нажатии Enter снимаем фокус с поля
		if (e.key === "Enter") {
			(e.target as HTMLInputElement).blur();
		}
	};

	// Расчет процента скидки
	const calculateDiscount = (): number | null => {
		if (!product.oldPrice) return null;
		const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
		return discount > 0 ? discount : null;
	};

	const discount = calculateDiscount();

	return (
		<div className='flex flex-col sm:flex-row items-start sm:items-center py-3 sm:py-4 border-b border-gray-200'>
			<Link
				href={`/products/${product.id}`}
				className='flex flex-col sm:flex-row items-start sm:items-center flex-1 hover:opacity-90 transition-opacity'
			>
				{/* Изображение товара */}
				<div className='w-20 h-20 sm:w-24 sm:h-24 mr-3 sm:mr-4 relative mb-2 sm:mb-0 flex-shrink-0'>
					{product.image && isValidUrl(product.image) && !imageError ? (
						<Image
							src={product.image}
							alt={`${product.brand?.name || product.brandName} ${product.model}`}
							fill
							className='object-cover rounded-md'
							onError={() => setImageError(true)}
						/>
					) : (
						<div className='w-full h-full bg-gray-200 flex items-center justify-center rounded-md'>
							<span className='text-gray-400 text-xs sm:text-sm'>Нет фото</span>
						</div>
					)}
				</div>

				{/* Информация о товаре */}
				<div className='flex-1 pr-2 sm:pr-4'>
					<p className='text-xs sm:text-sm font-bold text-black mb-0.5 sm:mb-1'>
						{product.brand?.name || product.brandName}
					</p>
					<p className='text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1'>
						{product.category?.name} | {product.model}
					</p>
					{product.selectedSize && (
						<p className='text-xs sm:text-sm text-gray-700 mb-0.5 sm:mb-1'>
							Размер: <span className='font-medium'>{product.selectedSize}</span>
						</p>
					)}
					<div className='flex items-center'>
						<p className='text-sm sm:text-lg font-semibold'>{formatPrice(product.price)}</p>
						{product.oldPrice && (
							<>
								<p className='text-xs sm:text-sm line-through text-gray-500 ml-1 sm:ml-2'>
									{formatPrice(product.oldPrice)}
								</p>
								{discount && (
									<span className='ml-1 sm:ml-2 bg-red-500 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded'>
										-{discount}%
									</span>
								)}
							</>
						)}
					</div>
				</div>
			</Link>

			{/* Кнопки управления количеством */}
			<div
				className='flex flex-col sm:flex-row items-end sm:items-center mt-2 sm:mt-0 gap-2 sm:gap-0 w-full sm:w-auto'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center border border-gray-300 rounded-md overflow-hidden'>
					<button
						onClick={decreaseQuantity}
						className={`w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:outline-none touch-manipulation ${
							isUpdating ? "opacity-50 cursor-not-allowed" : ""
						}`}
						aria-label='Уменьшить количество'
						disabled={isUpdating}
					>
						<Minus size={16} />
					</button>
					<input
						type='number'
						value={localQuantity}
						onChange={handleQuantityChange}
						onBlur={handleBlur}
						onKeyDown={handleKeyDown}
						className='w-10 text-center p-0 text-sm font-medium border-0 border-x border-gray-200 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
						min='1'
						max='100'
						disabled={isUpdating}
						aria-label='Количество товара'
					/>
					<button
						onClick={increaseQuantity}
						className={`w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:outline-none touch-manipulation ${
							isUpdating ? "opacity-50 cursor-not-allowed" : ""
						}`}
						aria-label='Увеличить количество'
						disabled={isUpdating}
					>
						<Plus size={16} />
					</button>
				</div>
				<button
					onClick={handleRemove}
					className={`ml-0 sm:ml-3 w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 focus:outline-none touch-manipulation ${
						isUpdating ? "opacity-50 cursor-not-allowed" : ""
					}`}
					aria-label='Удалить товар'
					disabled={isUpdating}
				>
					<Trash2 size={18} />
				</button>

				{/* Итоговая цена (для мобильных устройств) */}
				<div className='ml-auto sm:hidden mt-2 text-right'>
					<p className='text-sm font-medium'>Итого: {formatPrice(product.price * localQuantity)}</p>
				</div>
			</div>
		</div>
	);
}
