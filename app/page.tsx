import { Metadata, Viewport } from "next";
import { prisma } from "@/lib/prisma";
import { Product } from "./components/products/ProductCard";
import ProductCarousel from "./components/home/ProductCarousel";
import BrandsList from "./components/home/BrandsList";
import FeaturedCategories from "./components/home/FeaturedCategories";
import NewArrivals from "./components/home/NewArrivals";
import WhyChooseUs from "./components/home/WhyChooseUs";

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
				brand: true,
			},
			orderBy: { createdAt: "desc" },
			take: 4, // Ограничим количество товаров на главной странице
		});

		// Преобразуем даты в строки для совместимости с интерфейсом Product
		return products.map((product) => ({
			...product,
			name: `${product.brand?.name || ""} ${product.model || ""}`.trim(),
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
				brand: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5, // Ограничим количество товаров для карусели
		});

		return featuredProducts.map((product) => ({
			...product,
			name: `${product.brand?.name || ""} ${product.model || ""}`.trim(),
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
			<ProductCarousel products={featuredProducts.length > 0 ? featuredProducts : products.slice(0, 5)} />
			{categories.length > 0 && <FeaturedCategories categories={categories} />}
			<NewArrivals products={products} />
			<BrandsList brands={brands} />
			<WhyChooseUs />
		</main>
	);
}
