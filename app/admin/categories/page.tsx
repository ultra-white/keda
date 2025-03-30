"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";
import { Folder, Edit2, Trash2 } from "lucide-react";
import FilterSortPanel from "@/app/components/admin/FilterSortPanel";
import { sortItems, parseSortString, generateSortOptions } from "@/app/lib/admin/sortUtils";

interface Category {
	id: string;
	name: string;
	description: string;
	slug: string;
}

export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOrder, setSortOrder] = useState("");
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { isAdmin, isLoading: authLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const fetchCategories = async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/admin/categories");
				if (!res.ok) {
					throw new Error("Не удалось загрузить категории");
				}
				const data = await res.json();
				setCategories(data);
				setFilteredCategories(data);
			} catch (err) {
				setError("Ошибка при загрузке категорий");
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};

		if (!authLoading) {
			if (isAdmin) {
				fetchCategories();
			} else {
				router.push("/auth/signin");
			}
		}
	}, [isAdmin, authLoading, router]);

	// Фильтрация и сортировка категорий
	useEffect(() => {
		let results = categories;

		// Фильтрация по поисковому запросу
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			results = results.filter((category) => {
				const name = category.name.toLowerCase();
				const description = (category.description || "").toLowerCase();
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

		setFilteredCategories(results);
	}, [categories, searchTerm, sortOrder]);

	const handleSlugGeneration = (value: string) => {
		setName(value);
		// Генерация slug на основе названия категории
		const generatedSlug = value
			.toLowerCase()
			.replace(/[^\w\s-]/g, "") // Удаление специальных символов
			.replace(/\s+/g, "-") // Замена пробелов на дефис
			.replace(/--+/g, "-") // Удаление повторяющихся дефисов
			.trim();
		setSlug(generatedSlug);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormError(null);
		setSuccessMessage(null);
		setIsSubmitting(true);

		try {
			if (!name || !slug) {
				setFormError("Название и slug обязательны для заполнения");
				setIsSubmitting(false);
				return;
			}

			let url = "/api/admin/categories";
			let method = "POST";
			let message = "Категория успешно создана";

			if (editingCategory) {
				url = `/api/admin/categories/${editingCategory.id}`;
				method = "PUT";
				message = "Категория успешно обновлена";
			}

			const res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name, slug }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Не удалось сохранить категорию");
			}

			// Обновление списка категорий
			const updatedRes = await fetch("/api/admin/categories");
			if (updatedRes.ok) {
				const updatedCategories = await updatedRes.json();
				setCategories(updatedCategories);
			}

			// Сброс формы
			resetForm();
			setSuccessMessage(message);

			// Скрываем сообщение через 3 секунды
			setTimeout(() => {
				setSuccessMessage(null);
			}, 3000);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : "Ошибка при сохранении категории";
			setFormError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (window.confirm("Вы уверены, что хотите удалить эту категорию?")) {
			try {
				setSuccessMessage(null);
				const res = await fetch(`/api/admin/categories/${id}`, {
					method: "DELETE",
				});

				if (!res.ok) {
					throw new Error("Не удалось удалить категорию");
				}

				// Обновление списка категорий
				setCategories(categories.filter((category) => category.id !== id));
				setSuccessMessage("Категория успешно удалена");

				// Скрываем сообщение через 3 секунды
				setTimeout(() => {
					setSuccessMessage(null);
				}, 3000);
			} catch (err) {
				setFormError("Ошибка при удалении категории");
				console.error(err);
			}
		}
	};

	const handleEdit = (category: Category) => {
		setEditingCategory(category);
		setName(category.name);
		setSlug(category.slug);
	};

	const resetForm = () => {
		setEditingCategory(null);
		setName("");
		setSlug("");
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
	const sortOptions = generateSortOptions([
		{ key: "name", label: "Название" },
		{ key: "slug", label: "Slug" },
	]);

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
			<h1 className='text-2xl font-bold mb-6'>Управление категориями</h1>

			{/* Сообщение об успехе */}
			{successMessage && (
				<div className='fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-md'>
					{successMessage}
				</div>
			)}

			{/* Форма добавления/редактирования */}
			<div className='bg-white rounded-md shadow p-6 mb-8'>
				<h2 className='text-xl font-semibold mb-4'>
					{editingCategory ? "Редактирование категории" : "Добавление новой категории"}
				</h2>

				{formError && (
					<div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{formError}</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
							Название категории *
						</label>
						<Input
							id='name'
							type='text'
							value={name}
							onChange={(e) => handleSlugGeneration(e.target.value)}
							placeholder='Например: Кроссовки'
							required
						/>
					</div>

					<div>
						<label htmlFor='slug' className='block text-sm font-medium text-gray-700 mb-1'>
							URL-идентификатор (slug) *
						</label>
						<Input
							id='slug'
							type='text'
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder='Например: elektronika'
							required
						/>
						<p className='text-sm text-gray-500 mt-1'>
							Используется в URL адресе. Должен содержать только латинские буквы, цифры и дефисы.
						</p>
					</div>

					<div className='flex space-x-4 pt-4'>
						<Button type='submit' isLoading={isSubmitting}>
							{editingCategory ? "Сохранить изменения" : "Добавить категорию"}
						</Button>

						{editingCategory && (
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
				searchPlaceholder='Поиск по названию или описанию'
				sortOptions={sortOptions}
				initialSearchTerm={searchTerm}
				initialSortValue={sortOrder}
				totalItems={filteredCategories.length}
				itemsLabel='Всего категорий'
				icon={<Folder className='h-4 w-4' />}
				showSort={true}
				showFilter={false}
				showTotalItems={true}
			/>

			{/* Таблица категорий */}
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
							{filteredCategories.length > 0 ? (
								filteredCategories.map((category) => (
									<tr key={category.id} className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center'>
												<Folder className='h-5 w-5 text-gray-400 mr-2' />
												<div className='text-sm font-medium text-gray-900'>{category.name}</div>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='text-sm text-gray-500 max-w-md truncate'>
												{category.description || "Нет описания"}
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
											<div className='flex space-x-3'>
												<Button variant='outline' size='sm' onClick={() => handleEdit(category)}>
													<Edit2 className='h-3 w-3 mr-1' />
													Редактировать
												</Button>
												<Button variant='danger' size='sm' onClick={() => handleDelete(category.id)}>
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
										Категории не найдены
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
