"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";
import { BookOpen, Edit2, Trash2, Search } from "lucide-react";
import FilterSortPanel from "@/app/components/admin/FilterSortPanel";
import { sortItems, parseSortString, generateSortOptions } from "@/app/lib/admin/sortUtils";

interface Brand {
	id: string;
	name: string;
	description: string;
}

export default function BrandsPage() {
	const [brands, setBrands] = useState<Brand[]>([]);
	const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
	const [name, setName] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOrder, setSortOrder] = useState("");
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { isAdmin, isLoading: authLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const fetchBrands = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/admin/brands");
				if (!res.ok) {
					throw new Error("Не удалось загрузить бренды");
				}
				const data = await res.json();
				setBrands(data);
			} catch (err) {
				setError("Ошибка при загрузке брендов");
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};

		if (!authLoading) {
			if (isAdmin) {
				fetchBrands();
			} else {
				router.push("/auth/signin");
			}
		}
	}, [isAdmin, authLoading, router]);

	// Фильтрация и сортировка брендов
	useEffect(() => {
		let results = brands;

		// Фильтрация по поисковому запросу
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			results = results.filter((brand) => {
				const name = brand.name.toLowerCase();
				const description = (brand.description || "").toLowerCase();
				return name.includes(term) || description.includes(term);
			});
		}

		// Сортировка
		if (sortOrder) {
			const [sortKey, sortDirection] = parseSortString(sortOrder);
			if (sortKey) {
				results = sortItems(results, sortKey, sortDirection);
			}
		}

		setFilteredBrands(results);
	}, [brands, searchTerm, sortOrder]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormError(null);
		setSuccessMessage(null);
		setIsSubmitting(true);

		try {
			if (!name) {
				setFormError("Название бренда обязательно для заполнения");
				setIsSubmitting(false);
				return;
			}

			let url = "/api/admin/brands";
			let method = "POST";
			let message = "Бренд успешно создан";

			if (editingBrand) {
				url = `/api/admin/brands/${editingBrand.id}`;
				method = "PUT";
				message = "Бренд успешно обновлен";
			}

			const res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Не удалось сохранить бренд");
			}

			// Обновление списка брендов
			const updatedRes = await fetch("/api/admin/brands");
			if (updatedRes.ok) {
				const updatedBrands = await updatedRes.json();
				setBrands(updatedBrands);
			}

			// Сброс формы
			resetForm();
			setSuccessMessage(message);

			// Скрываем сообщение через 3 секунды
			setTimeout(() => {
				setSuccessMessage(null);
			}, 3000);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "Ошибка при сохранении бренда";
			setFormError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("Вы уверены, что хотите удалить этот бренд?")) {
			try {
				setSuccessMessage(null);
				const res = await fetch(`/api/admin/brands/${id}`, {
					method: "DELETE",
				});

				if (!res.ok) {
					throw new Error("Не удалось удалить бренд");
				}

				// Обновление списка брендов
				setBrands(brands.filter((brand) => brand.id !== id));
				setSuccessMessage("Бренд успешно удален");

				// Скрываем сообщение через 3 секунды
				setTimeout(() => {
					setSuccessMessage(null);
				}, 3000);
			} catch (err) {
				setFormError("Ошибка при удалении бренда");
				console.error(err);
			}
		}
	};

	const handleEdit = (brand: Brand) => {
		setEditingBrand(brand);
		setName(brand.name);
	};

	const resetForm = () => {
		setEditingBrand(null);
		setName("");
		setFormError(null);
	};

	// Обработчики для компонента FilterSortPanel
	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleSortChange = (sort: string) => {
		setSortOrder(sort);
	};

	// Опции сортировки
	const sortOptions = generateSortOptions([{ key: "name", label: "Название" }]);

	if (isLoading || authLoading) {
		return (
			<div className='flex justify-center items-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-red-100 p-4 rounded-md'>
				<p className='text-red-700'>{error}</p>
				<button onClick={() => window.location.reload()} className='mt-2 bg-red-600 text-white px-4 py-2 rounded-md'>
					Попробовать снова
				</button>
			</div>
		);
	}

	if (!isAdmin) {
		return null; // Перенаправление уже происходит в useEffect
	}

	return (
		<div>
			<h1 className='text-2xl font-bold mb-6'>Управление брендами</h1>

			{/* Сообщение об успехе */}
			{successMessage && (
				<div className='fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-md'>
					{successMessage}
				</div>
			)}

			{/* Форма добавления/редактирования */}
			<div className='bg-white rounded-md shadow p-6 mb-8'>
				<h2 className='text-xl font-semibold mb-4'>
					{editingBrand ? "Редактирование бренда" : "Добавление нового бренда"}
				</h2>

				{formError && (
					<div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{formError}</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
							Название бренда *
						</label>
						<Input
							id='name'
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder='Например: Nike'
							required
						/>
					</div>

					<div className='flex space-x-4 pt-4'>
						<Button type='submit' isLoading={isSubmitting}>
							{editingBrand ? "Сохранить изменения" : "Добавить бренд"}
						</Button>

						{editingBrand && (
							<Button type='button' onClick={resetForm} variant='outline'>
								Отмена
							</Button>
						)}
					</div>
				</form>
			</div>

			{/* Использование нового компонента для поиска и сортировки */}
			<FilterSortPanel
				onSearch={handleSearch}
				onSortChange={handleSortChange}
				searchPlaceholder='Поиск по названию'
				sortOptions={sortOptions}
				initialSearchTerm={searchTerm}
				initialSortValue={sortOrder}
				totalItems={filteredBrands.length}
				itemsLabel='Всего брендов'
				icon={<BookOpen className='h-4 w-4' />}
				showSort={true}
				showFilter={false}
				showTotalItems={true}
			/>

			{/* Таблица брендов */}
			<div className='bg-white rounded-md shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Название
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Описание
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Действия
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{filteredBrands.length > 0 ? (
								filteredBrands.map((brand) => (
									<tr key={brand.id} className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center'>
												<BookOpen className='h-5 w-5 text-gray-400 mr-2' />
												<div className='text-sm font-medium text-gray-900'>{brand.name}</div>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='text-sm text-gray-500 max-w-md truncate'>
												{brand.description || "Нет описания"}
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
											<div className='flex space-x-3'>
												<Button variant='outline' size='sm' onClick={() => handleEdit(brand)}>
													<Edit2 className='h-3 w-3 mr-1' />
													Редактировать
												</Button>
												<Button variant='danger' size='sm' onClick={() => handleDelete(brand.id)}>
													<Trash2 className='h-3 w-3 mr-1' />
													Удалить
												</Button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={3} className='px-6 py-4 text-center text-sm text-gray-500'>
										Бренды не найдены
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
