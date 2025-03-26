"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";
import Image from "next/image";

interface Category {
	id: string;
	name: string;
	slug: string;
	image?: string;
}

interface FeaturedCategoriesProps {
	categories: Category[];
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
	// Определяем цвета для фоновых плиток
	const bgColors = ["bg-gray-100", "bg-blue-50", "bg-amber-50", "bg-emerald-50", "bg-rose-50", "bg-purple-50"];

	// Выбираем максимум 6 категорий для отображения
	const displayCategories = categories.slice(0, 6);

	// Иконки по умолчанию, если нет изображений
	const defaultIcons = [<ShoppingBag key='bag' className='h-8 w-8 text-gray-700' />];

	// Функция для создания URL категории, такая же как в Header.tsx
	const getCategoryUrl = (categorySlug: string) => {
		const params = new URLSearchParams();
		params.set("category", categorySlug);
		return `/products?${params.toString()}`;
	};

	return (
		<div className='grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6'>
			{displayCategories.map((category, index) => (
				<motion.div
					key={category.id}
					className={`${
						bgColors[index % bgColors.length]
					} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
					whileHover={{ y: -5 }}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.1 }}
				>
					<Link href={getCategoryUrl(category.slug)} className='block p-6 h-full'>
						<div className='flex items-center justify-between'>
							<div className='flex-1'>
								<h3 className='font-semibold text-lg mb-2'>{category.name}</h3>
								<div className='flex items-center text-sm text-black/70 hover:text-black'>
									<span>Смотреть</span>
									<ChevronRight className='h-4 w-4 ml-1' />
								</div>
							</div>
							<div className='w-16 h-16 flex items-center justify-center'>
								{category.image ? (
									<div className='relative w-full h-full'>
										<Image src={category.image} alt={category.name} fill sizes='64px' className='object-contain' />
									</div>
								) : (
									defaultIcons[0]
								)}
							</div>
						</div>
					</Link>
				</motion.div>
			))}
		</div>
	);
}
