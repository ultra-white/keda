import { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";
import ProductList from "./components/products/ProductList";
import Link from "next/link";
import { Product } from "./components/products/ProductCard";
import ProductCarousel from "./components/home/ProductCarousel";
import BrandsList from "./components/home/BrandsList";
import FeaturedCategories from "./components/home/FeaturedCategories";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "Кеда - Интернет-магазин обуви",
	description: "Интернет-магазин обуви с широким ассортиментом по выгодным ценам",
	keywords: "обувь, кроссовки, ботинки, туфли, кеды, интернет-магазин",
};

async function getProducts() {
	try {
		const products = await prisma.product.findMany({
			include: {
				category: true,
			},
			orderBy: { createdAt: "desc" },
			take: 12, // Ограничим количество товаров на главной странице
		});

		// Преобразуем даты в строки для совместимости с интерфейсом Product
		return products.map((product) => ({
			...product,
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString(),
		})) as Product[];
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

async function getFeaturedProducts() {
	try {
		// Получаем избранные товары (которые можно выделить на главной)
		const featuredProducts = await prisma.product.findMany({
			where: {
				OR: [{ isNew: true }, { isOnSale: true }],
			},
			include: {
				category: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5, // Ограничим количество товаров для карусели
		});

		return featuredProducts.map((product) => ({
			...product,
			createdAt: product.createdAt.toISOString(),
			updatedAt: product.updatedAt.toISOString(),
		})) as Product[];
	} catch (error) {
		console.error("Error fetching featured products:", error);
		return [];
	}
}

export default async function Home() {
	const products = await getProducts();
	const categories = await getCategories();
	const featuredProducts = await getFeaturedProducts();

	// Бренды (в реальном проекте можно было бы получать из базы данных)
	const brands = [
		{ id: 1, name: "Nike", logo: "/brands/nike.png" },
		{ id: 2, name: "Adidas", logo: "/brands/adidas.png" },
		{ id: 3, name: "Puma", logo: "/brands/puma.png" },
		{ id: 4, name: "Reebok", logo: "/brands/reebok.png" },
		{ id: 5, name: "Fila", logo: "/brands/fila.png" },
	];

	return (
		<main className='container mx-auto px-[25px] lg:px-[50px] py-0'>
			{/* Баннер с каруселью */}
			<section className='mb-12 mt-0 pt-0'>
				<ProductCarousel products={featuredProducts.length > 0 ? featuredProducts : products.slice(0, 5)} />
			</section>

			{/* Популярные категории */}
			{categories.length > 0 && (
				<section className='mb-12'>
					<h2 className='text-2xl font-bold mb-6 text-center'>Популярные категории</h2>
					<FeaturedCategories categories={categories} />
				</section>
			)}

			{/* Новые поступления */}
			<section className='mb-16'>
				<div className='flex justify-between items-center mb-6'>
					<h2 className='text-2xl font-bold'>Новые поступления</h2>
					<Link href='/products' className='text-black hover:underline flex items-center'>
						Посмотреть все
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-4 w-4 ml-1'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
						</svg>
					</Link>
				</div>

				<ProductList products={products} />
			</section>

			{/* Бренды */}
			<section className='mb-12'>
				<h2 className='text-2xl font-bold mb-6 text-center'>Бренды</h2>
				<BrandsList brands={brands} />
			</section>

			{/* Информационный блок */}
			<section className='mb-12 bg-gray-100 p-8 rounded-lg'>
				<div className='max-w-3xl mx-auto text-center'>
					<h2 className='text-2xl font-bold mb-4'>Почему Кеда?</h2>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
						<div className='text-center'>
							<div className='flex justify-center mb-4'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='h-10 w-10 text-gray-700'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
								</svg>
							</div>
							<h3 className='font-bold mb-2'>Гарантия качества</h3>
							<p className='text-gray-600'>Мы предлагаем только оригинальную продукцию от известных брендов</p>
						</div>
						<div className='text-center'>
							<div className='flex justify-center mb-4'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='h-10 w-10 text-gray-700'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
							</div>
							<h3 className='font-bold mb-2'>Быстрая доставка</h3>
							<p className='text-gray-600'>Доставка по всей России в течение 1-3 рабочих дней</p>
						</div>
						<div className='text-center'>
							<div className='flex justify-center mb-4'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									className='h-10 w-10 text-gray-700'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
									/>
								</svg>
							</div>
							<h3 className='font-bold mb-2'>Удобная оплата</h3>
							<p className='text-gray-600'>Различные способы оплаты для вашего удобства</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
