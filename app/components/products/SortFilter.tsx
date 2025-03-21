"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function SortFilter() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Получаем текущий параметр сортировки из URL или устанавливаем значение по умолчанию
	const sortOrder = searchParams.get("sort") || "price_asc";

	// Обработчик изменения сортировки
	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		// Создаем новые параметры поиска на основе текущих
		const params = new URLSearchParams(searchParams.toString());

		// Если выбрана сортировка, добавляем ее в URL, иначе удаляем
		if (e.target.value) {
			params.set("sort", e.target.value);
		} else {
			params.delete("sort");
		}

		// Перенаправляем на новый URL с параметрами
		router.push(`${pathname}?${params.toString()}`);
	};

	return (
		<div className='relative inline-block text-left'>
			<select
				name='sort'
				onChange={handleSortChange}
				className='bg-white border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black'
				value={sortOrder}
			>
				<option value='price_asc'>Цена ↑</option>
				<option value='price_desc'>Цена ↓</option>
				<option value='name_asc'>Название ↑</option>
				<option value='name_desc'>Название ↓</option>
			</select>
		</div>
	);
}
