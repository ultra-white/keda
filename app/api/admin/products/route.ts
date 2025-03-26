import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение списка всех товаров
export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
		}

		const products = await prisma.product.findMany({
			include: {
				category: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(products);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json({ error: "Ошибка при получении товаров" }, { status: 500 });
	}
}

// Создание нового товара
export async function POST(req: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
		}

		const { brand, model, price, oldPrice, description, categoryId, image } = await req.json();

		if (!model || !price || !description || !categoryId || !image) {
			return NextResponse.json({ error: "Все обязательные поля должны быть заполнены" }, { status: 400 });
		}

		// Проверка существования категории
		const category = await prisma.category.findUnique({
			where: { id: categoryId },
		});

		if (!category) {
			return NextResponse.json({ error: "Указанная категория не найдена" }, { status: 400 });
		}

		// Подготовка данных для создания продукта
		const productData: {
			model: string;
			price: number;
			description: string;
			categoryId: string;
			image: string;
			oldPrice?: number;
			isOnSale?: boolean;
			brandId?: string;
			brandName: string;
		} = {
			model,
			price: typeof price === "string" ? parseFloat(price) : price,
			description,
			categoryId,
			image,
			brandName: brand || "",
		};

		// Если указана старая цена, добавляем ее и устанавливаем флаг isOnSale
		if (oldPrice && oldPrice > 0) {
			productData.oldPrice = typeof oldPrice === "string" ? parseFloat(oldPrice) : oldPrice;
			// Устанавливаем флаг скидки только если старая цена больше новой
			productData.isOnSale = productData.oldPrice! > productData.price;
		}

		// Если указан ID бренда, проверяем его существование и используем
		if (brand && brand.length > 10) {
			// Если длина больше 10, считаем что это ID
			const brandRecord = await prisma.brand.findUnique({
				where: { id: brand },
			});

			if (!brandRecord) {
				return NextResponse.json({ error: "Указанный бренд не найден" }, { status: 400 });
			}

			productData.brandId = brand;
			productData.brandName = brandRecord.name;
		} else {
			// Иначе используем переданное значение как имя бренда
			productData.brandName = brand;
		}

		const product = await prisma.product.create({
			data: productData,
			include: {
				category: true,
				brand: true,
			},
		});

		return NextResponse.json(product);
	} catch (error) {
		console.error("Error creating product:", error);
		return NextResponse.json({ error: "Ошибка при создании товара" }, { status: 500 });
	}
}
