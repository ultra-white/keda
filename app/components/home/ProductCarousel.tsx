"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "../products/ProductCard";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

interface ProductCarouselProps {
	products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isHovering, setIsHovering] = useState(false);
	const [touchStart, setTouchStart] = useState<number | null>(null);
	const [touchEnd, setTouchEnd] = useState<number | null>(null);
	const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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

	// Автоматическое переключение слайдов, если не на паузе
	useEffect(() => {
		if (isHovering) return;

		const intervalId = setInterval(() => {
			setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
		}, 4000);

		return () => clearInterval(intervalId);
	}, [products.length, isHovering]);

	// Функции для навигации
	const goToNext = () => {
		setCurrentIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
	};

	const goToPrev = () => {
		setCurrentIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
	};

	const goToSlide = (index: number) => {
		setCurrentIndex(index);
	};

	// Обработчики свайпа на мобильных устройствах
	const handleTouchStart = (e: React.TouchEvent) => {
		setTouchStart(e.targetTouches[0].clientX);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		setTouchEnd(e.targetTouches[0].clientX);
	};

	const handleTouchEnd = () => {
		if (!touchStart || !touchEnd) return;
		const distance = touchStart - touchEnd;
		const isLeftSwipe = distance > 50;
		const isRightSwipe = distance < -50;

		if (isLeftSwipe) {
			goToNext();
		} else if (isRightSwipe) {
			goToPrev();
		}

		setTouchStart(null);
		setTouchEnd(null);
	};

	if (products.length === 0) return null;

	return (
		<div
			className='relative h-[450px] md:h-[500px] overflow-hidden rounded-lg mt-4'
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			{/* Слайды */}
			<div
				className='absolute inset-0 transition-transform duration-500 ease-out'
				style={{
					transform: `translateX(-${currentIndex * 100}%)`,
				}}
			>
				<div className='flex h-full' style={{ width: `${products.length * 100}%` }}>
					{products.map((product) => (
						<div key={product.id} className='h-full bg-gray-100' style={{ width: `${100 / products.length}%` }}>
							<div className='h-full flex flex-col md:flex-row'>
								{/* Изображение */}
								<div className='flex-1 overflow-hidden flex items-center justify-center bg-white relative'>
									{product.image && isValidUrl(product.image) && !imageErrors[product.id] ? (
										<div className='relative w-full h-full'>
											<Image
												src={product.image}
												alt={product.model}
												fill
												sizes='(max-width: 768px) 100vw, 50vw'
												className='object-contain hover:scale-105 transition-transform'
												onError={() => setImageErrors((prev) => ({ ...prev, [product.id]: true }))}
											/>
										</div>
									) : (
										<div className='w-full h-full bg-gray-200 flex items-center justify-center'>
											<span className='text-gray-400 font-medium'>Нет изображения</span>
										</div>
									)}

									{/* Метки в углу изображения */}
									<div className='absolute top-2 left-2 flex flex-col gap-2'>
										{product.isNew && <span className='bg-blue-500 text-white text-xs px-2 py-1 rounded'>Новинка</span>}
										{product.isOnSale && (
											<span className='bg-red-500 text-white text-xs px-2 py-1 rounded'>Скидка</span>
										)}
									</div>
								</div>

								{/* Информация о товаре */}
								<div className='md:w-1/3 p-6 md:p-8 flex flex-col justify-center bg-gray-100'>
									<h2 className='text-xl md:text-2xl font-bold mb-2'>
										{product.brandName} {product.model}
									</h2>
									<p className='text-gray-600 mb-4 line-clamp-3'>{product.description}</p>

									<div className='flex items-center mb-6'>
										<span className='text-xl font-bold mr-3'>{formatPrice(product.price)}</span>
										{product.oldPrice && (
											<span className='text-gray-500 line-through'>{formatPrice(product.oldPrice)}</span>
										)}
									</div>

									<Link
										href={`/products/${product.id}`}
										className='inline-block bg-black text-white font-semibold px-6 py-3 mb-3 rounded-md hover:bg-gray-800 transition-colors'
									>
										Подробнее
									</Link>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Стрелки навигации */}
			<button
				onClick={goToPrev}
				className='absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 opacity-70 p-2 rounded-full cursor-pointer shadow-md transition-all z-10'
				aria-label='Предыдущий слайд'
			>
				<ChevronLeft className='h-6 w-6 text-black' />
			</button>

			<button
				onClick={goToNext}
				className='absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-50 opacity-70 p-2 rounded-full cursor-pointer shadow-md transition-all z-10'
				aria-label='Следующий слайд'
			>
				<ChevronRight className='h-6 w-6 text-black' />
			</button>

			{/* Точки индикатора */}
			<div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10'>
				{products.map((_, index) => (
					<button
						key={index}
						onClick={() => goToSlide(index)}
						className={`h-2 w-2 rounded-full transition-all ${currentIndex === index ? "bg-black w-4" : "bg-gray-400"}`}
						aria-label={`Перейти к слайду ${index + 1}`}
					/>
				))}
			</div>
		</div>
	);
}
