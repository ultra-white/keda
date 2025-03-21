"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface Brand {
	id: string;
	name: string;
}

interface BrandFilterProps {
	brands: Brand[];
	selectedBrands?: string[];
}

export default function BrandFilter({ brands, selectedBrands = [] }: BrandFilterProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isOpen, setIsOpen] = useState(false);

	// Обработчик изменения выбранных брендов
	const handleBrandChange = (brandName: string, isChecked: boolean) => {
		const current = new URLSearchParams(Array.from(searchParams.entries()));

		// Получаем текущие выбранные бренды
		const currentBrands = current.getAll("brand");

		// Если чекбокс отмечен, добавляем бренд в список
		if (isChecked) {
			if (!currentBrands.includes(brandName)) {
				current.append("brand", brandName);
			}
		}
		// Если чекбокс снят, удаляем бренд из списка
		else {
			const updatedBrands = currentBrands.filter((name) => name !== brandName);
			current.delete("brand");
			updatedBrands.forEach((brand) => current.append("brand", brand));
		}

		// Обновляем URL с новыми параметрами
		const search = current.toString();
		const query = search ? `?${search}` : "";
		router.push(`${pathname}${query}`);
	};

	// Если нет брендов, не показываем фильтр
	if (brands.length === 0) {
		return null;
	}

	return (
		<div className='w-full mb-6'>
			<h3 className='font-medium mb-2 flex justify-between items-center'>
				<span>Бренды</span>
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

			{/* Список брендов с чекбоксами */}
			<div
				className={`space-y-1 transition-all duration-300 overflow-hidden ${
					isOpen ? "max-h-60 overflow-y-auto" : "max-h-0"
				}`}
			>
				{brands.map((brand) => (
					<label
						key={brand.id}
						className='flex items-center px-3 py-2 cursor-pointer rounded hover:bg-gray-100 transition-colors'
					>
						<input
							type='checkbox'
							checked={selectedBrands.includes(brand.name)}
							onChange={(e) => handleBrandChange(brand.name, e.target.checked)}
							className='mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-black'
						/>
						<span className='text-sm text-gray-700'>{brand.name}</span>
					</label>
				))}
			</div>
		</div>
	);
}
