import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fuzzyMatch } from "@/lib/utils";

// Получение списка товаров для публичного доступа
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const categorySlug = searchParams.get("category");
	const searchQuery = searchParams.get("search");
	const similarityThreshold = searchParams.get("threshold") ? parseInt(searchParams.get("threshold") as string) : 90; // По умолчанию 90%

	try {
		const whereClause: {
			category?: {
				slug: string;
			};
		} = {};

		// Фильтрация по категории
		if (categorySlug) {
			whereClause.category = {
				slug: categorySlug,
			};
		}

		// Если нет поискового запроса, используем стандартный запрос Prisma
		if (!searchQuery) {
			const products = await prisma.product.findMany({
				where: whereClause,
				include: {
					category: true,
				},
				orderBy: { createdAt: "desc" },
			});

			return NextResponse.json(products);
		}

		// Если есть поисковый запрос, получим все продукты и применим нечёткий поиск
		// Сначала получаем все продукты, соответствующие категории (если указана)
		const allProducts = await prisma.product.findMany({
			where: whereClause,
			include: {
				category: true,
			},
		});

		// Применяем нечёткий поиск
		const filteredProducts = allProducts.filter((product) => {
			// Проверяем соответствие в названии бренда
			const brandMatch = fuzzyMatch(product.brandName, searchQuery, similarityThreshold);
			// Проверяем соответствие в названии модели
			const modelMatch = fuzzyMatch(product.model, searchQuery, similarityThreshold);

			// Продукт соответствует, если соответствует либо бренд, либо модель
			return brandMatch || modelMatch;
		});

		// Сортируем по дате создания (как было в исходном запросе)
		filteredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return NextResponse.json(filteredProducts);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json({ error: "Ошибка при получении товаров" }, { status: 500 });
	}
}
