"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Button from "@/app/components/shared/Button";
import Input from "@/app/components/shared/Input";
import Image from "next/image";
import { ShoppingBag, Search, Edit2, Trash2 } from "lucide-react";
import FilterSortPanel from "@/app/components/admin/FilterSortPanel";
import { sortItems, parseSortString, generateSortOptions } from "@/app/lib/admin/sortUtils";

interface Product {
	id: string;
	brandId: string | null;
	brand: {
		id: string;
		name: string;
	} | null;
	brandName: string;
	model: string;
	price: number;
	oldPrice?: number;
	description: string;
	categoryId: string;
	image: string;
	createdAt: string;
	category: {
		id: string;
		name: string;
		slug: string;
	};
}

interface Category {
	id: string;
	name: string;
	slug: string;
}

interface Brand {
	id: string;
	name: string;
}

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [brands, setBrands] = useState<Brand[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [sortOrder, setSortOrder] = useState("");
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Поля формы
	const [brandId, setBrandId] = useState("");
	const [brandName, setBrandName] = useState("");
	const [useBrandId, setUseBrandId] = useState(true);
	const [model, setModel] = useState("");
	const [price, setPrice] = useState("");
	const [oldPrice, setOldPrice] = useState("");
	const [description, setDescription] = useState("");
	const [categoryId, setCategoryId] = useState("");
	const [imageUrl, setImageUrl] = useState("");

	const { isAdmin, isLoading: authLoading } = useAuth();
	const router = useRouter();

	// Внутри компонента ProductsPage добавляю новое состояние для отслеживания ошибок изображений
	const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

	// Загрузка товаров и категорий
	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				// Загрузка товаров
				const productsRes = await fetch("/api/admin/products");
				if (!productsRes.ok) {
					throw new Error("Не удалось загрузить товары");
				}
				const productsData = await productsRes.json();
				setProducts(productsData);
				setFilteredProducts(productsData);

				// Загрузка категорий
				const categoriesRes = await fetch("/api/admin/categories");
				if (!categoriesRes.ok) {
					throw new Error("Не удалось загрузить категории");
				}
				const categoriesData = await categoriesRes.json();
				setCategories(categoriesData);

				// Загрузка брендов
				const brandsRes = await fetch("/api/admin/brands");
				if (!brandsRes.ok) {
					throw new Error("Не удалось загрузить бренды");
				}
				const brandsData = await brandsRes.json();
				setBrands(brandsData);
			} catch (err) {
				setError("Ошибка при загрузке данных");
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		};

		if (!authLoading) {
			if (isAdmin) {
				fetchData();
			} else {
				router.push("/auth/signin");
			}
		}
	}, [isAdmin, authLoading, router]);

	// Фильтрация и сортировка товаров при изменении поисковой строки, фильтра категорий или сортировки
	useEffect(() => {
		let results = products;

		// Фильтр по поисковому запросу
		if (searchTerm) {
			const searchLower = searchTerm.toLowerCase();
			results = results.filter((product) => {
				const brandName = product.brand?.name || product.brandName;
				return (
					brandName.toLowerCase().includes(searchLower) ||
					product.model.toLowerCase().includes(searchLower) ||
					product.description.toLowerCase().includes(searchLower)
				);
			});
		}

		// Фильтр по категории
		if (categoryFilter) {
			results = results.filter((product) => product.categoryId === categoryFilter);
		}

		// Сортировка, если задан sortOrder
		if (sortOrder) {
			const [sortKey, sortDirection] = parseSortString(sortOrder);
			if (sortKey) {
				results = sortItems(results, sortKey, sortDirection);
			}
		}

		setFilteredProducts(results);
	}, [products, searchTerm, categoryFilter, sortOrder]);

	// Обработка отправки формы
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setFormError(null);
		setSuccessMessage(null);
		setIsSubmitting(true);

		try {
			// Валидация формы
			if (!model || !price || !description || !categoryId) {
				setFormError("Заполните все обязательные поля");
				setIsSubmitting(false);
				return;
			}

			// Проверка цены
			const priceValue = parseFloat(price);
			if (isNaN(priceValue) || priceValue <= 0) {
				setFormError("Цена должна быть положительным числом");
				setIsSubmitting(false);
				return;
			}

			// Проверка старой цены, если она указана
			let oldPriceValue = null;
			if (oldPrice) {
				oldPriceValue = parseFloat(oldPrice);
				if (isNaN(oldPriceValue) || oldPriceValue <= 0) {
					setFormError("Старая цена должна быть положительным числом");
					setIsSubmitting(false);
					return;
				}
			}

			// Проверка изображения
			if (!imageUrl) {
				setFormError("Укажите URL изображения");
				setIsSubmitting(false);
				return;
			}

			// Проверка корректности URL изображения
			if (imageUrl && !isValidUrl(imageUrl)) {
				setFormError("Указан некорректный URL изображения. URL должен начинаться с http:// или https://");
				setIsSubmitting(false);
				return;
			}

			let url = "/api/admin/products";
			let method = "POST";
			let message = "Товар успешно создан";

			if (editingProduct) {
				url = `/api/admin/products/${editingProduct.id}`;
				method = "PUT";
				message = "Товар успешно обновлен";
			}

			const res = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					brand: useBrandId ? brandId : brandName,
					model,
					price: priceValue,
					oldPrice: oldPriceValue,
					description,
					categoryId,
					image: imageUrl,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Не удалось сохранить товар");
			}

			// Обновление списка товаров
			const updatedRes = await fetch("/api/admin/products");
			if (updatedRes.ok) {
				const updatedProducts = await updatedRes.json();
				setProducts(updatedProducts);
			}

			// Сброс формы
			resetForm();
			setSuccessMessage(message);

			// Скрываем сообщение через 3 секунды
			setTimeout(() => {
				setSuccessMessage(null);
			}, 3000);
		} catch (error) {
			if (error instanceof Error) {
				setFormError(error.message);
			} else {
				setFormError("Ошибка при сохранении товара");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Обработка удаления товара
	const handleDelete = async (id: string) => {
		if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
			try {
				setSuccessMessage(null);
				const res = await fetch(`/api/admin/products/${id}`, {
					method: "DELETE",
				});

				if (!res.ok) {
					throw new Error("Не удалось удалить товар");
				}

				// Обновление списка товаров
				setProducts(products.filter((product) => product.id !== id));
				setSuccessMessage("Товар успешно удален");

				// Скрываем сообщение через 3 секунды
				setTimeout(() => {
					setSuccessMessage(null);
				}, 3000);
			} catch (err) {
				setFormError("Ошибка при удалении товара");
				console.error(err);
			}
		}
	};

	// Обработка редактирования товара
	const handleEdit = (product: Product) => {
		setEditingProduct(product);
		if (product.brandId) {
			setBrandId(product.brandId);
			setUseBrandId(true);
		} else {
			setBrandName(product.brandName);
			setUseBrandId(false);
		}
		setModel(product.model);
		setPrice(product.price.toString());
		setOldPrice(product.oldPrice ? product.oldPrice.toString() : "");
		setDescription(product.description);
		setCategoryId(product.categoryId);
		setImageUrl(product.image || "");
	};

	// Сброс формы
	const resetForm = () => {
		setEditingProduct(null);
		setBrandId("");
		setBrandName("");
		setUseBrandId(true);
		setModel("");
		setPrice("");
		setOldPrice("");
		setDescription("");
		setCategoryId("");
		setImageUrl("");
		setFormError(null);
	};

	// Сброс фильтров
	const resetFilters = () => {
		setSearchTerm("");
		setCategoryFilter("");
		setSortOrder("");
	};

	// Проверка является ли строка корректным URL
	const isValidUrl = (urlString: string): boolean => {
		try {
			// Если это простая строка типа "123", добавляем заглушку протокола, чтобы избежать ошибки
			if (!/^https?:\/\//i.test(urlString)) {
				return false;
			}
			new URL(urlString);
			return true;
		} catch {
			return false;
		}
	};

	// Обработчики для компонента FilterSortPanel
	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleFilterChange = (categoryId: string) => {
		setCategoryFilter(categoryId);
	};

	const handleSortChange = (sort: string) => {
		setSortOrder(sort);
	};

	// Опции сортировки
	const sortOptions = generateSortOptions([
		{ key: "price", label: "Цена" },
		{ key: "brandName", label: "Бренд" },
		{ key: "model", label: "Модель" },
		{ key: "createdAt", label: "Дата создания" },
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
			<h1 className='text-2xl font-bold mb-6'>Управление товарами</h1>

			{/* Сообщение об успехе */}
			{successMessage && (
				<div className='fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-md'>
					{successMessage}
				</div>
			)}

			{/* Форма добавления/редактирования */}
			<div className='bg-white rounded-md shadow p-6 mb-8'>
				<h2 className='text-xl font-semibold mb-4'>
					{editingProduct ? "Редактирование товара" : "Добавление нового товара"}
				</h2>

				{formError && (
					<div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{formError}</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label htmlFor='use-brand-id' className='flex items-center mb-2'>
							<input
								type='checkbox'
								id='use-brand-id'
								checked={useBrandId}
								onChange={() => setUseBrandId(!useBrandId)}
								className='mr-2'
							/>
							<span className='text-sm font-medium text-gray-700'>Выбрать из существующих брендов</span>
						</label>
					</div>

					{useBrandId ? (
						<div>
							<label htmlFor='brand' className='block text-sm font-medium text-gray-700 mb-1'>
								Бренд товара *
							</label>
							<select
								id='brand'
								value={brandId}
								onChange={(e) => setBrandId(e.target.value)}
								className='w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
								required
							>
								<option value=''>Выберите бренд</option>
								{brands.map((brand) => (
									<option key={brand.id} value={brand.id}>
										{brand.name}
									</option>
								))}
							</select>
						</div>
					) : (
						<div>
							<label htmlFor='brand-name' className='block text-sm font-medium text-gray-700 mb-1'>
								Название бренда *
							</label>
							<Input
								id='brand-name'
								type='text'
								value={brandName}
								onChange={(e) => setBrandName(e.target.value)}
								placeholder='Например: Nike'
								required
							/>
						</div>
					)}

					<div>
						<label htmlFor='model' className='block text-sm font-medium text-gray-700 mb-1'>
							Модель товара *
						</label>
						<Input
							id='model'
							type='text'
							value={model}
							onChange={(e) => setModel(e.target.value)}
							placeholder='Например: Air Max'
							required
						/>
					</div>

					<div>
						<label htmlFor='price' className='block text-sm font-medium text-gray-700 mb-1'>
							Цена (₽) *
						</label>
						<Input
							id='price'
							type='text'
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							placeholder='Например: 15000'
							required
						/>
					</div>

					<div>
						<label htmlFor='oldPrice' className='block text-sm font-medium text-gray-700 mb-1'>
							Старая цена (₽)
						</label>
						<Input
							id='oldPrice'
							type='text'
							value={oldPrice}
							onChange={(e) => setOldPrice(e.target.value)}
							placeholder='Если есть скидка'
						/>
						<p className='text-sm text-gray-500 mt-1'>Укажите, если товар со скидкой</p>
					</div>

					<div>
						<label htmlFor='category' className='block text-sm font-medium text-gray-700 mb-1'>
							Категория *
						</label>
						<select
							id='category'
							value={categoryId}
							onChange={(e) => setCategoryId(e.target.value)}
							className='w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
							required
						>
							<option value=''>Выберите категорию</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
						{categories.length > 5 && (
							<p className='text-sm text-gray-500 mt-1'>Доступно {categories.length} категорий</p>
						)}
					</div>

					<div>
						<label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-1'>
							Описание *
						</label>
						<textarea
							id='description'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							className='w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
							placeholder='Подробное описание товара'
							required
						/>
					</div>

					<div>
						<label htmlFor='imageUrl' className='block text-sm font-medium text-gray-700 mb-1'>
							URL изображения
						</label>
						<Input
							id='imageUrl'
							type='text'
							value={imageUrl}
							onChange={(e) => setImageUrl(e.target.value)}
							placeholder='https://example.com/image.jpg'
						/>
						<p className='text-sm text-gray-500 mt-1'>Рекомендуемый размер изображения: 600x600 пикселей</p>

						{/* Предпросмотр изображения */}
						{imageUrl && (
							<div className='mt-3'>
								<p className='text-sm font-medium text-gray-700 mb-2'>Предпросмотр:</p>
								<div className='relative h-32 w-32 border border-gray-200 rounded'>
									{isValidUrl(imageUrl) ? (
										<Image
											src={imageUrl}
											alt='Предпросмотр товара'
											fill
											className='object-cover rounded'
											onError={() => {
												setFormError("Не удалось загрузить изображение. Проверьте URL.");
											}}
										/>
									) : (
										<div className='w-full h-full bg-gray-100 flex items-center justify-center text-center p-2 rounded'>
											<span className='text-gray-400 text-xs'>
												Некорректный URL
												<br />
												{imageUrl.length > 20 ? `${imageUrl.substring(0, 20)}...` : imageUrl}
											</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					<div className='flex space-x-4 pt-4'>
						<Button type='submit' isLoading={isSubmitting}>
							{editingProduct ? "Сохранить изменения" : "Добавить товар"}
						</Button>

						{editingProduct && (
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
				onFilterChange={handleFilterChange}
				onSortChange={handleSortChange}
				searchPlaceholder='Поиск по названию или описанию'
				filterOptions={categories}
				sortOptions={sortOptions}
				initialSearchTerm={searchTerm}
				initialFilterValue={categoryFilter}
				initialSortValue={sortOrder}
				totalItems={filteredProducts.length}
				itemsLabel='Всего товаров'
				icon={<ShoppingBag className='h-4 w-4' />}
				showSort={true}
				showFilter={true}
				showTotalItems={true}
			/>

			{/* Таблица товаров */}
			<div className='bg-white rounded-md shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Товар
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Категория
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Цена</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Действия
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{filteredProducts.length > 0 ? (
								filteredProducts.map((product) => (
									<tr key={product.id} className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center'>
												<div className='flex-shrink-0 h-10 w-10 relative'>
													{product.image && (
														<Image
															src={product.image}
															alt={`${product.brandName} ${product.model}`}
															fill
															className='object-cover rounded-md'
															sizes='40px'
															onError={() => {
																// Обработка ошибки загрузки изображения
																setImageErrors((prev) => ({ ...prev, [product.id]: true }));
															}}
														/>
													)}
													{(!product.image || imageErrors[product.id]) && (
														<div className='h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center'>
															<ShoppingBag className='h-5 w-5 text-gray-400' />
														</div>
													)}
												</div>
												<div className='ml-4'>
													<div className='text-sm font-medium text-gray-900'>
														{product.brandName} {product.model}
													</div>
												</div>
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{product.category?.name || "Без категории"}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{product.price} ₽</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
											<div className='flex space-x-3'>
												<Button variant='outline' size='sm' onClick={() => handleEdit(product)}>
													<Edit2 className='h-3 w-3 mr-1' />
													Редактировать
												</Button>
												<Button variant='danger' size='sm' onClick={() => handleDelete(product.id)}>
													<Trash2 className='h-3 w-3 mr-1' />
													Удалить
												</Button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={4} className='px-6 py-4 text-center text-sm text-gray-500'>
										Товары не найдены
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
