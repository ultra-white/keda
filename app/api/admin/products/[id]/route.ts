import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение товара по ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
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

		const id = params.id;
		const product = await prisma.product.findUnique({
			where: { id },
			include: {
				category: true,
				brand: true,
			},
		});

		if (!product) {
			return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
		}

		return NextResponse.json(product);
	} catch (error) {
		console.error("Error fetching product:", error);
		return NextResponse.json({ error: "Ошибка при получении товара" }, { status: 500 });
	}
}

// Обновление товара
export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

		// Проверка существования товара
		const id = params.id;
		const product = await prisma.product.findUnique({
			where: { id },
			include: {
				category: true,
				brand: true,
			},
		});

		if (!product) {
			return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
		}

		// Проверка существования категории
		const category = await prisma.category.findUnique({
			where: { id: categoryId },
		});

		if (!category) {
			return NextResponse.json({ error: "Категория не найдена" }, { status: 400 });
		}

		// Подготовка данных для обновления продукта
		const productData: {
			model: string;
			price: number;
			description: string;
			categoryId: string;
			image: string;
			oldPrice?: number | null;
			isOnSale?: boolean;
			brandId?: string | null;
			brandName?: string;
		} = {
			model,
			price: parseFloat(price),
			description,
			categoryId,
			image,
		};

		// Если указана старая цена, добавляем ее и устанавливаем флаг isOnSale
		if (oldPrice && oldPrice > 0) {
			productData.oldPrice = parseFloat(oldPrice);
			// Устанавливаем флаг скидки только если старая цена больше новой
			productData.isOnSale = productData.oldPrice > productData.price;
		} else {
			// Если старая цена не указана, сбрасываем значения
			productData.oldPrice = null;
			productData.isOnSale = false;
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
			productData.brandId = null;
		}

		const updatedProduct = await prisma.product.update({
			where: { id },
			data: productData,
			include: {
				category: true,
				brand: true,
			},
		});

		return NextResponse.json(updatedProduct);
	} catch (error) {
		console.error("Error updating product:", error);
		return NextResponse.json({ error: "Ошибка при обновлении товара" }, { status: 500 });
	}
}

// Удаление товара
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

		// Проверка существования товара
		const id = params.id;
		const product = await prisma.product.findUnique({
			where: { id },
		});

		if (!product) {
			return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
		}

		await prisma.product.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting product:", error);
		return NextResponse.json({ error: "Ошибка при удалении товара" }, { status: 500 });
	}
}
