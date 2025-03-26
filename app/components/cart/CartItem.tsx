"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Product } from "@/app/components/products/ProductCard";
import { useCart } from "@/app/contexts/CartContext";
import Link from "next/link";
import { useState } from "react";

interface CartItemProps {
	product: Product;
	quantity: number;
}

export default function CartItem({ product, quantity }: CartItemProps) {
	const { updateQuantity, removeItem } = useCart();
	const [imageError, setImageError] = useState(false);

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
	const increaseQuantity = () => {
		updateQuantity(product.id, quantity + 1, product.selectedSize);
	};

	// Уменьшение количества
	const decreaseQuantity = () => {
		if (quantity > 1) {
			updateQuantity(product.id, quantity - 1, product.selectedSize);
		} else {
			removeItem(product.id, product.selectedSize);
		}
	};

	// Удаление товара
	const handleRemove = () => {
		removeItem(product.id, product.selectedSize);
	};

	// Расчет процента скидки
	const calculateDiscount = (): number | null => {
		if (!product.oldPrice) return null;
		const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
		return discount > 0 ? discount : null;
	};

	const discount = calculateDiscount();

	return (
		<div className='flex flex-col sm:flex-row items-start sm:items-center py-4 border-b border-gray-200'>
			<Link
				href={`/products/${product.id}`}
				className='flex flex-col sm:flex-row items-start sm:items-center flex-1 hover:opacity-90 transition-opacity'
			>
				{/* Изображение товара */}
				<div className='w-full sm:w-24 h-24 mr-4 relative mb-3 sm:mb-0'>
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
							<span className='text-gray-400 text-sm'>Нет фото</span>
						</div>
					)}
				</div>

				{/* Информация о товаре */}
				<div className='flex-1 pr-4'>
					<p className='text-sm font-bold text-black mb-1'>{product.brand?.name || product.brandName}</p>
					<p className='text-sm text-gray-500 mb-1'>
						{product.category.name} | {product.model}
					</p>
					{product.selectedSize && (
						<p className='text-sm text-gray-700 mb-1'>
							Размер: <span className='font-medium'>{product.selectedSize}</span>
						</p>
					)}
					<div className='flex items-center'>
						<p className='text-lg font-semibold'>{formatPrice(product.price)}</p>
						{product.oldPrice && (
							<>
								<p className='text-sm line-through text-gray-500 ml-2'>{formatPrice(product.oldPrice)}</p>
								{discount && <span className='ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded'>-{discount}%</span>}
							</>
						)}
					</div>
				</div>
			</Link>

			{/* Кнопки управления количеством */}
			<div className='flex items-center mt-3 sm:mt-0'>
				<div className='flex items-center border border-gray-300 rounded-md'>
					<button
						onClick={decreaseQuantity}
						className='px-2 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none'
						aria-label='Уменьшить количество'
					>
						<Minus size={16} />
					</button>
					<span className='px-3 py-1 font-medium'>{quantity}</span>
					<button
						onClick={increaseQuantity}
						className='px-2 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none'
						aria-label='Увеличить количество'
					>
						<Plus size={16} />
					</button>
				</div>
				<button
					onClick={handleRemove}
					className='ml-3 text-red-500 hover:text-red-700 focus:outline-none'
					aria-label='Удалить товар'
				>
					<Trash2 size={20} />
				</button>
			</div>

			{/* Итоговая цена (для мобильных устройств) */}
			<div className='w-full mt-2 sm:hidden'>
				<p className='text-right font-medium'>Итого: {formatPrice(product.price * quantity)}</p>
			</div>
		</div>
	);
}
