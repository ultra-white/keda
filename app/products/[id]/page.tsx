import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Product } from "@/app/components/products/ProductCard";
import SizeSelector from "@/app/components/products/SizeSelector";

type ProductParams = Promise<{ id: string }>;

interface ProductPageProps {
	params: ProductParams;
}

// Динамические метаданные для страницы товара
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
	const { id } = await params;
	const product = await getProduct(id);

	if (!product) {
		return {
			title: "Товар не найден",
			description: "Запрашиваемый товар не найден или был удалён",
		};
	}

	return {
		title: `${product.brand?.name || product.brandName} ${product.model} - Кеда`,
		description: product.description.substring(0, 160),
	};
}

// Получение информации о товаре
async function getProduct(id: string): Promise<Product | null> {
	try {
		const dbProduct = await prisma.product.findUnique({
			where: { id },
			include: {
				category: true,
				brand: true,
			},
		});

		if (!dbProduct) {
			return null;
		}

		// Преобразование данных Prisma в тип Product
		const productData = {
			...dbProduct,
			createdAt: dbProduct.createdAt.toISOString(),
			updatedAt: dbProduct.updatedAt.toISOString(),
		};

		return productData as unknown as Product;
	} catch (error) {
		console.error("Error fetching product:", error);
		return null;
	}
}

// Получение похожих товаров
async function getSimilarProducts(categoryId: string, currentProductId: string): Promise<Product[]> {
	try {
		const dbProducts = await prisma.product.findMany({
			where: {
				categoryId,
				id: { not: currentProductId },
			},
			include: {
				category: true,
				brand: true,
			},
			take: 4, // Ограничиваем количество похожих товаров
		});

		// Преобразование данных Prisma в тип Product[]
		return dbProducts.map((dbProduct) => ({
			...dbProduct,
			createdAt: dbProduct.createdAt.toISOString(),
			updatedAt: dbProduct.updatedAt.toISOString(),
		})) as unknown as Product[];
	} catch (error) {
		console.error("Error fetching similar products:", error);
		return [];
	}
}

// Функция для проверки корректности URL
function isValidUrl(urlString: string): boolean {
	try {
		if (!urlString || typeof urlString !== "string") return false;
		if (!/^https?:\/\//i.test(urlString)) {
			return false;
		}
		new URL(urlString);
		return true;
	} catch {
		return false;
	}
}

// Форматирование цены
function formatPrice(price: number) {
	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: "RUB",
		minimumFractionDigits: 0,
	}).format(price);
}

// Расчет процента скидки
function calculateDiscount(price: number, oldPrice: number | null | undefined): number | null {
	if (!oldPrice) return null;
	const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
	return discount > 0 ? discount : null;
}

export default async function ProductPage({ params }: ProductPageProps) {
	const { id } = await params;
	const product = await getProduct(id);

	if (!product) {
		notFound();
	}

	const similarProducts = await getSimilarProducts(product.categoryId, product.id);

	return (
		<main className='container mx-auto px-[25px] lg:px-[50px] py-12 mt-8'>
			{/* Кнопка назад */}
			<Link href='/products' className='inline-flex items-center text-black mb-8 hover:text-gray-700 hover:underline'>
				<ArrowLeft className='h-4 w-4 mr-2' />
				Вернуться к каталогу
			</Link>

			{/* Информация о товаре */}
			<div className='flex flex-col md:flex-row gap-8 mb-16'>
				{/* Изображение товара */}
				<div className='w-full md:w-1/2'>
					<div className='relative aspect-square w-full h-auto rounded-lg overflow-hidden bg-gray-100'>
						{product.image && isValidUrl(product.image) ? (
							<Image
								src={product.image}
								alt={`${product.brand?.name || product.brandName} ${product.model}`}
								fill
								className='object-cover'
								priority
							/>
						) : (
							<div className='w-full h-full flex items-center justify-center'>
								<span className='text-gray-400 text-lg'>Нет изображения</span>
							</div>
						)}
					</div>
				</div>

				{/* Детали товара */}
				<div className='w-full md:w-1/2'>
					<p className='text-2xl font-bold mb-1'>{product.brand?.name || product.brandName}</p>
					<h1 className='text-xl font-medium mb-4'>{product.model}</h1>

					{/* Цена и скидка */}
					<div className='mb-6'>
						{product.oldPrice && product.oldPrice > product.price ? (
							<div className='flex items-center'>
								<p className='text-3xl font-bold text-black'>{formatPrice(product.price)}</p>
								<p className='text-xl line-through text-gray-500 ml-3'>{formatPrice(product.oldPrice)}</p>
								<span className='ml-3 bg-red-500 text-white text-sm px-2 py-1 rounded'>
									Скидка {calculateDiscount(product.price, product.oldPrice)}%
								</span>
							</div>
						) : (
							<p className='text-3xl font-bold'>{formatPrice(product.price)}</p>
						)}
					</div>

					<div className='mb-8'>
						<h2 className='text-lg font-semibold mb-2'>Описание</h2>
						<p className='text-gray-700 whitespace-pre-line'>{product.description}</p>
					</div>

					<div className='mb-6'>
						<h2 className='text-lg font-semibold mb-2'>Характеристики</h2>
						<ul className='space-y-2'>
							<li className='flex'>
								<span className='font-medium w-32'>Бренд:</span>
								<span className='font-bold'>{product.brand?.name || product.brandName}</span>
							</li>
							<li className='flex'>
								<span className='font-medium w-32'>Модель:</span>
								<span>{product.model}</span>
							</li>
							<li className='flex'>
								<span className='font-medium w-32'>Категория:</span>
								<span>{product.category.name}</span>
							</li>
						</ul>
					</div>

					{/* Размерная сетка */}
					<div className='mb-6'>
						<h2 className='text-lg font-semibold mb-2'>Выберите размер</h2>
						<SizeSelector product={product} />
					</div>
				</div>
			</div>

			{/* Похожие товары */}
			{similarProducts.length > 0 && (
				<div>
					<h2 className='text-2xl font-bold mb-6'>Похожие товары</h2>
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
						{similarProducts.map((similarProduct) => (
							<div key={similarProduct.id} className='bg-white rounded-lg shadow overflow-hidden'>
								<Link href={`/products/${similarProduct.id}`}>
									<div className='relative h-48 bg-gray-100'>
										{similarProduct.image && isValidUrl(similarProduct.image) ? (
											<Image
												src={similarProduct.image}
												alt={`${similarProduct.brand?.name || similarProduct.brandName} ${similarProduct.model}`}
												fill
												className='object-contain p-2'
											/>
										) : (
											<div className='w-full h-full flex items-center justify-center'>
												<span className='text-gray-400'>Нет изображения</span>
											</div>
										)}
									</div>
								</Link>
								<div className='p-4'>
									<p className='text-base font-bold'>{similarProduct.brand?.name || similarProduct.brandName}</p>
									<Link href={`/products/${similarProduct.id}`}>
										<h3 className='text-sm font-medium text-gray-600 hover:text-black line-clamp-2'>
											{similarProduct.model}
										</h3>
									</Link>
									{similarProduct.oldPrice && similarProduct.oldPrice > similarProduct.price ? (
										<div className='mt-2 flex items-center'>
											<p className='font-bold'>{formatPrice(similarProduct.price)}</p>
											<p className='text-sm line-through text-gray-500 ml-2'>{formatPrice(similarProduct.oldPrice)}</p>
										</div>
									) : (
										<p className='mt-2 font-bold'>{formatPrice(similarProduct.price)}</p>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</main>
	);
}
