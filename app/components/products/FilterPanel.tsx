"use client";

import Link from "next/link";
import { useState } from "react";
import PriceRangeFilter from "./PriceRangeFilter";
import CategoryFilter from "./CategoryFilter";
import BrandFilter from "./BrandFilter";

// Определение типа для категории
interface Category {
	id: string;
	name: string;
	slug: string;
}

// Определение типа для бренда
interface Brand {
	id: string;
	name: string;
}

interface FilterPanelProps {
	categories: Category[];
	brands: Brand[];
	priceRange: { min: number; max: number };
	categorySlug?: string;
	selectedBrands?: string[];
	minPrice?: number;
	maxPrice?: number;
	searchQuery?: string;
	sortOrder?: string;
}

export default function FilterPanel({
	categories,
	brands,
	priceRange,
	categorySlug,
	selectedBrands = [],
	minPrice,
	maxPrice,
	searchQuery,
	sortOrder,
}: FilterPanelProps) {
	const [isFiltersVisible, setIsFiltersVisible] = useState(false);

	// Проверяем, есть ли активные фильтры
	const hasActiveFilters =
		categorySlug ||
		selectedBrands.length > 0 ||
		(minPrice !== undefined && minPrice > priceRange.min) ||
		(maxPrice !== undefined && maxPrice < priceRange.max) ||
		searchQuery ||
		(sortOrder && sortOrder !== "price_asc");

	return (
		<div className='bg-white rounded-lg shadow p-4 md:p-6'>
			<h2 className='text-xl font-semibold flex justify-between items-center'>
				<span>Фильтры</span>
				<button
					className='md:hidden text-sm text-gray-600 hover:text-black flex items-center cursor-pointer'
					onClick={() => setIsFiltersVisible(!isFiltersVisible)}
				>
					<span className='mr-1 cursor-pointer'>{isFiltersVisible ? "Скрыть" : "Показать"}</span>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
						className={`transition-transform ${isFiltersVisible ? "rotate-180" : ""} cursor-pointer`}
					>
						<polyline points='6 9 12 15 18 9'></polyline>
					</svg>
				</button>
			</h2>

			{/* Кнопка сброса фильтров - показываем всегда при наличии активных фильтров, даже если меню свёрнуто */}
			{hasActiveFilters && (
				<div className='mt-4 mb-2 md:hidden'>
					<Link
						href='/products'
						className='block w-full py-2 px-4 text-center bg-gray-100 text-black hover:bg-gray-200 rounded-md transition-colors'
					>
						Сбросить фильтры
					</Link>
				</div>
			)}

			{/* Разделитель - виден только когда фильтры открыты на мобильном */}
			<div className={`${isFiltersVisible ? "block" : "hidden"} md:block h-[1px] bg-gray-200 w-full my-4`}></div>

			{/* Контент фильтров - скрыт на мобильных по умолчанию */}
			<div className={`${isFiltersVisible ? "block" : "hidden"} md:block space-y-6`}>
				{/* Фильтр по цене */}
				<PriceRangeFilter minPossiblePrice={priceRange.min} maxPossiblePrice={priceRange.max} />

				{/* Выпадающее меню категорий */}
				<CategoryFilter categories={categories} />

				{/* Фильтр по брендам */}
				<BrandFilter brands={brands} selectedBrands={selectedBrands} />

				{/* Кнопка сброса фильтров внутри раскрытого меню - показываем только на десктопе или внутри открытого меню */}
				{hasActiveFilters && (
					<div className='mt-6 hidden md:block'>
						<Link
							href='/products'
							className='block w-full py-2 px-4 text-center bg-gray-100 text-black hover:bg-gray-200 rounded-md transition-colors'
						>
							Сбросить фильтры
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
