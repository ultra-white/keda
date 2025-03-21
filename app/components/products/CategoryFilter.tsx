"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

// Интерфейс для категории
interface Category {
	id: string;
	name: string;
	slug: string;
}

interface CategoryFilterProps {
	categories: Category[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Состояние для отслеживания открытия/закрытия меню
	const [isOpen, setIsOpen] = useState(false);

	// Получаем текущую категорию из URL
	const categorySlug = searchParams.get("category");

	// Находим текущую категорию по slug
	const currentCategory = categorySlug ? categories.find((cat) => cat.slug === categorySlug) : null;

	// Текст для отображения текущей категории
	const categoryText = currentCategory ? currentCategory.name : "Все категории";

	// Выбор категории
	const selectCategory = (slug: string | null) => {
		// Создаем новый объект URLSearchParams из текущих параметров
		const params = new URLSearchParams(searchParams.toString());

		// Если выбрана категория, добавляем ее в URL, иначе удаляем
		if (slug) {
			params.set("category", slug);
		} else {
			params.delete("category");
		}

		// Перенаправляем на новый URL с параметрами
		router.push(`${pathname}?${params.toString()}`);

		// Закрываем список категорий после выбора
		setIsOpen(false);
	};

	return (
		<div className='w-full'>
			<h3 className='font-medium mb-2 flex justify-between items-center'>
				<span>{categoryText}</span>
				<button
					className='text-gray-600 hover:text-black flex items-center text-sm cursor-pointer'
					onClick={() => setIsOpen(!isOpen)}
				>
					<span className='cursor-pointer'>{isOpen ? "Скрыть" : "Показать"}</span>
					<ChevronDown
						className={`ml-1 w-4 h-4 transition-transform ${isOpen ? "transform rotate-180" : ""} cursor-pointer`}
					/>
				</button>
			</h3>

			{/* Список категорий (раскрывающийся внутри блока) */}
			<div className={`space-y-1 transition-all duration-300 overflow-hidden ${isOpen ? "max-h-60" : "max-h-0"}`}>
				{/* Пункт "Все категории" */}
				<div
					className={`px-3 py-2 cursor-pointer rounded hover:bg-gray-100 transition-colors ${
						!categorySlug ? "bg-gray-100 font-bold" : ""
					}`}
					onClick={() => selectCategory(null)}
				>
					Все категории
				</div>

				{/* Список категорий */}
				{categories.map((category) => (
					<div
						key={category.id}
						className={`px-3 py-2 cursor-pointer rounded hover:bg-gray-100 transition-colors ${
							categorySlug === category.slug ? "bg-gray-100 font-bold" : ""
						}`}
						onClick={() => selectCategory(category.slug)}
					>
						{category.name}
					</div>
				))}
			</div>
		</div>
	);
}
