"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Input from "@/app/components/shared/Input";

interface SortOption {
	value: string;
	label: string;
}

interface FilterOption {
	id: string;
	name: string;
}

interface FilterSortPanelProps {
	onSearch: (term: string) => void;
	onFilterChange?: (filterId: string) => void;
	onSortChange?: (sortValue: string) => void;
	searchPlaceholder?: string;
	filterOptions?: FilterOption[];
	sortOptions?: SortOption[];
	initialSearchTerm?: string;
	initialFilterValue?: string;
	initialSortValue?: string;
	totalItems?: number;
	itemsLabel?: string;
	icon?: React.ReactNode;
	showSort?: boolean;
	showFilter?: boolean;
	showTotalItems?: boolean;
}

export default function FilterSortPanel({
	onSearch,
	onFilterChange,
	onSortChange,
	searchPlaceholder = "Поиск...",
	filterOptions = [],
	sortOptions = [],
	initialSearchTerm = "",
	initialFilterValue = "",
	initialSortValue = "",
	totalItems,
	itemsLabel = "Всего",
	icon,
	showSort = false,
	showFilter = true,
	showTotalItems = true,
}: FilterSortPanelProps) {
	const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
	const [filterValue, setFilterValue] = useState(initialFilterValue);
	const [sortValue, setSortValue] = useState(initialSortValue);
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);

	// Дебаунс для поиска
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 300);

		return () => {
			clearTimeout(timer);
		};
	}, [searchTerm]);

	// Применяем поиск при изменении дебаунсированного значения
	useEffect(() => {
		onSearch(debouncedSearchTerm);
	}, [debouncedSearchTerm, onSearch]);

	// Обработчик изменения фильтра
	const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = e.target.value;
		setFilterValue(newValue);
		if (onFilterChange) {
			onFilterChange(newValue);
		}
	};

	// Обработчик изменения сортировки
	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newValue = e.target.value;
		setSortValue(newValue);
		if (onSortChange) {
			onSortChange(newValue);
		}
	};

	return (
		<>
			{/* Поиск и фильтры */}
			<div className='flex flex-col md:flex-row gap-4 mb-6'>
				<div className='flex-1'>
					<Input
						type='text'
						icon={<Search className='h-5 w-5' />}
						placeholder={searchPlaceholder}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				{showFilter && filterOptions.length > 0 && onFilterChange && (
					<select
						className='h-9 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'
						value={filterValue}
						onChange={handleFilterChange}
					>
						{filterOptions.map((option) => (
							<option key={option.id} value={option.id}>
								{option.name}
							</option>
						))}
					</select>
				)}

				{showSort && sortOptions.length > 0 && onSortChange && (
					<select
						className='h-9 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'
						value={sortValue}
						onChange={handleSortChange}
					>
						{sortOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				)}
			</div>

			{/* Показываем информацию о количестве только если нужно */}
			{showTotalItems && totalItems !== undefined && (
				<div className='flex justify-between items-center mb-6'>
					<div className='flex items-center text-sm text-gray-500'>
						{icon && <span className='mr-1'>{icon}</span>}
						<span>
							{itemsLabel}: {totalItems}
						</span>
					</div>
				</div>
			)}
		</>
	);
}
