import { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";
import ProductList from "@/app/components/products/ProductList";
import Link from "next/link";
import { Product } from "@/app/components/products/ProductCard";
import FilterPanel from "@/app/components/products/FilterPanel";
import SortFilter from "@/app/components/products/SortFilter";
import { fuzzyMatch } from "@/lib/utils";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "Кеда - Товары",
	description: "Каталог товаров магазина Кеда",
};

async function getProducts() {
	try {
		const products = await prisma.product.findMany({
			include: {
				category: true,
			},
			orderBy: { createdAt: "desc" },
		});

		// Преобразуем даты в строки для совместимости с интерфейсом Product
		return products.map((product) => ({
			...product,
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString(),
		})) as unknown as Product[];
	} catch (error) {
		console.error("Error fetching products:", error);
		return [];
	}
}

async function getCategories() {
	try {
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
		});

		return categories;
	} catch (error) {
		console.error("Error fetching categories:", error);
		return [];
	}
}

async function getBrands() {
	try {
		// Получаем все продукты
		const products = await getProducts();

		// Получаем уникальные названия брендов
		const brandNames = new Set<string>();

		// Собираем все названия брендов
		products.forEach((product) => {
			if (product.brandName) {
				brandNames.add(product.brandName);
			}
		});

		// Преобразуем Set в массив объектов для компонента
		const brands = Array.from(brandNames)
			.sort((a, b) => a.localeCompare(b))
			.map((name) => ({
				id: name, // В качестве id используем имя для простоты
				name: name,
			}));

		return brands;
	} catch (error) {
		console.error("Error fetching brands:", error);
		return [];
	}
}

// Функция для фильтрации товаров
function filterProducts(
	products: Product[],
	categorySlug?: string,
	brandNames?: string[],
	searchQuery?: string,
	minPrice?: number,
	maxPrice?: number,
	similarityThreshold: number = 90
) {
	return products.filter((product) => {
		// Фильтрация по категории
		if (categorySlug && product.category.slug !== categorySlug) {
			return false;
		}

		// Фильтрация по брендам
		if (brandNames && brandNames.length > 0) {
			// Используем brandName для фильтрации
			if (!product.brandName || !brandNames.includes(product.brandName)) {
				return false;
			}
		}

		// Нечёткий поиск по запросу с порогом similarityThreshold
		if (searchQuery) {
			const brandMatch = fuzzyMatch(product.brandName, searchQuery, similarityThreshold);
			const modelMatch = fuzzyMatch(product.model, searchQuery, similarityThreshold);

			// Если ни бренд, ни модель не соответствуют запросу с учетом порога
			if (!brandMatch && !modelMatch) {
				return false;
			}
		}

		// Фильтрация по минимальной цене
		if (minPrice !== undefined && product.price < minPrice) {
			return false;
		}

		// Фильтрация по максимальной цене
		if (maxPrice !== undefined && product.price > maxPrice) {
			return false;
		}

		return true;
	});
}

// Функция для получения минимальной и максимальной цены
function getPriceRange(products: Product[]) {
	if (products.length === 0) {
		return { min: 0, max: 10000 };
	}

	const prices = products.map((product) => product.price);
	return {
		min: Math.floor(Math.min(...prices)),
		max: Math.ceil(Math.max(...prices)),
	};
}

// Функция для сортировки товаров
function sortProducts(products: Product[], sortOrder?: string) {
	const productsCopy = [...products];

	switch (sortOrder) {
		case "price_asc":
			return productsCopy.sort((a, b) => a.price - b.price);
		case "price_desc":
			return productsCopy.sort((a, b) => b.price - a.price);
		case "name_asc":
			return productsCopy.sort((a, b) => a.model.localeCompare(b.model));
		case "name_desc":
			return productsCopy.sort((a, b) => b.model.localeCompare(a.model));
		default:
			// По умолчанию сортируем по возрастанию цены
			return productsCopy.sort((a, b) => a.price - b.price);
	}
}

export default async function ProductsPage({
	searchParams,
}: {
	searchParams?: { [key: string]: string | string[] | undefined };
}) {
	const products = await getProducts();
	const categories = await getCategories();
	const brands = await getBrands();
	const priceRange = getPriceRange(products);

	// Получаем параметры поиска после ожидания searchParams
	const resolvedSearchParams = await Promise.resolve(searchParams);
	const categoryParam = resolvedSearchParams?.category;
	const brandParams = resolvedSearchParams?.brand;
	const searchParam = resolvedSearchParams?.search;
	const minPriceParam = resolvedSearchParams?.minPrice;
	const maxPriceParam = resolvedSearchParams?.maxPrice;
	const sortParam = resolvedSearchParams?.sort;
	// Добавляем параметр порога сходства, по умолчанию 90
	const thresholdParam = resolvedSearchParams?.threshold;

	// Приводим к строкам и числам, если нужно
	const categorySlug = typeof categoryParam === "string" ? categoryParam : undefined;
	// Обработка множественных брендов
	const selectedBrands = Array.isArray(brandParams)
		? brandParams
		: typeof brandParams === "string"
		? [brandParams]
		: [];

	const searchQuery = typeof searchParam === "string" ? searchParam : undefined;
	const minPrice = typeof minPriceParam === "string" ? Number(minPriceParam) : undefined;
	const maxPrice = typeof maxPriceParam === "string" ? Number(maxPriceParam) : undefined;
	const sortOrder = typeof sortParam === "string" ? sortParam : "price_asc"; // По умолчанию сортировка по возрастанию цены
	// Порог сходства строк для нечёткого поиска (в процентах)
	const similarityThreshold = typeof thresholdParam === "string" ? Number(thresholdParam) : 90;

	// Фильтруем товары с использованием выделенной функции
	const filteredProducts = filterProducts(
		products,
		categorySlug,
		selectedBrands,
		searchQuery,
		minPrice,
		maxPrice,
		similarityThreshold
	);

	// Сортируем товары
	const sortedProducts = sortProducts(filteredProducts, sortOrder);

	return (
		<main className='container mx-auto px-[15px] sm:px-[25px] lg:px-[50px] py-4 sm:py-8'>
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-8 mb-4 sm:mb-8'>
				{/* Боковая панель с фильтрами */}
				<aside className='md:col-span-1'>
					<FilterPanel
						categories={categories}
						brands={brands}
						priceRange={priceRange}
						categorySlug={categorySlug}
						selectedBrands={selectedBrands}
						minPrice={minPrice}
						maxPrice={maxPrice}
						searchQuery={searchQuery}
						sortOrder={sortOrder}
					/>
				</aside>

				{/* Основной контент с товарами */}
				<div className='md:col-span-3'>
					{/* Информация о результатах поиска/фильтрации */}
					<div className='mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center'>
						<div>
							<h2 className='text-lg sm:text-xl font-semibold'>
								{categorySlug && categories.find((c) => c.slug === categorySlug)?.name
									? `Категория: ${categories.find((c) => c.slug === categorySlug)?.name}`
									: "Все товары"}
								{searchQuery && ` / Поиск: ${searchQuery}`}
								{selectedBrands.length > 0 && ` / Бренды: ${selectedBrands.join(", ")}`}
								{(minPrice || maxPrice) && " / Цена: "}
								{minPrice && `от ${minPrice} ₽`}
								{minPrice && maxPrice && " "}
								{maxPrice && `до ${maxPrice} ₽`}
							</h2>
							<p className='text-gray-600 text-sm sm:text-base'>Найдено товаров: {filteredProducts.length}</p>
						</div>

						{/* Сортировка по цене */}
						<div className='mt-3 sm:mt-0'>
							<SortFilter />
						</div>
					</div>

					{sortedProducts.length > 0 ? (
						<ProductList products={sortedProducts} />
					) : (
						<div className='bg-white rounded-lg shadow p-8 text-center'>
							<p className='text-xl text-gray-600 mb-4'>Товары не найдены</p>
							<p className='text-gray-500'>Попробуйте изменить параметры фильтрации или поиска</p>
							<Link
								href='/products'
								className='inline-block mt-6 bg-black text-white px-6 py-2 rounded hover:bg-gray-800'
							>
								Сбросить фильтры
							</Link>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
