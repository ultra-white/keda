"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";

export interface Product {
	id: string;
	brandId: string | null;
	brand: {
		id: string;
		name: string;
	} | null;
	brandName: string;
	model: string;
	price: number;
	oldPrice?: number | null;
	description: string;
	categoryId: string;
	image: string;
	createdAt: string;
	updatedAt: string;
	category: {
		id: string;
		name: string;
		slug: string;
	};
	selectedSize?: number | null;
	isNew?: boolean;
	isOnSale?: boolean;
}

interface ProductCardProps {
	product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
	const [imageError, setImageError] = useState(false);

	// Проверка является ли строка корректным URL
	const isValidUrl = (urlString: string): boolean => {
		try {
			if (!urlString || typeof urlString !== "string") return false;
			// Если URL не начинается с http:// или https://, считаем его локальным путем
			if (!/^https?:\/\//i.test(urlString)) {
				return true; // Возвращаем true для локальных путей (например /products/...)
			}
			new URL(urlString);
			return true;
		} catch {
			return false;
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
		<Link href={`/products/${product.id}`}>
			<div className='bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow'>
				<div className='relative'>
					{/* Изображение товара */}
					<div className='relative w-full aspect-square overflow-hidden'>
						{product.image && isValidUrl(product.image) && !imageError ? (
							<Image
								src={product.image}
								alt={`${product.brand?.name || product.brandName} ${product.model}`}
								fill
								sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
								className='object-contain object-center hover:scale-105 transition-transform duration-300'
								onError={() => setImageError(true)}
								priority={false}
							/>
						) : (
							<div className='w-full h-full bg-gray-200 flex items-center justify-center'>
								<span className='text-gray-400 font-medium'>Нет изображения</span>
							</div>
						)}
					</div>

					{/* Метки "Новинка" и "Скидка" */}
					<div className='absolute top-2 left-2 flex flex-col gap-2'>
						{product.isNew && <span className='bg-blue-500 text-white text-xs px-2 py-1 rounded'>Новинка</span>}
						{(product.isOnSale || discount) && (
							<span className='bg-red-500 text-white text-xs px-2 py-1 rounded'>
								Скидка {discount ? `${discount}%` : ""}
							</span>
						)}
					</div>
				</div>

				<div className='p-4'>
					{/* Информация о товаре */}
					<h3 className='font-semibold text-sm text-gray-800'>{product.brand?.name || product.brandName}</h3>
					<p className='text-gray-700 text-sm mb-2'>{product.model}</p>

					{/* Цена */}
					<div className='flex items-center'>
						<span className='font-bold'>{formatPrice(product.price)}</span>
						{product.oldPrice && (
							<span className='text-gray-500 text-sm line-through ml-2'>{formatPrice(product.oldPrice)}</span>
						)}
					</div>

					{/* Категория */}
					<div className='mt-2'>
						<span className='inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'>
							{product.category?.name || "Без категории"}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
}
