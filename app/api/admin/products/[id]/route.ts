import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Получение товара по ID
export async function GET(req: NextRequest, context: { params: { id: string } }) {
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

		const id = context.params.id;
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
export async function PUT(request: Request, context: { params: { id: string } }) {
	try {
		// Получаем параметры асинхронно
		const { id } = context.params;

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

		const { brand, model, price, oldPrice, description, categoryId, image } = await request.json();

		if (!model || !price || !description || !categoryId || !image) {
			return NextResponse.json({ error: "Все обязательные поля должны быть заполнены" }, { status: 400 });
		}

		// Проверка существования товара
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
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
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
		const id = context.params.id;
		const product = await prisma.product.findUnique({
			where: { id },
			include: {
				cartItems: true,
				orderItems: true,
				reviews: true,
			},
		});

		if (!product) {
			return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
		}

		// Удаление связанных данных перед удалением товара
		// 1. Удаление элементов корзины
		if (product.cartItems.length > 0) {
			await prisma.cartItem.deleteMany({
				where: { productId: id },
			});
		}

		// 2. Проверяем наличие элементов заказа
		if (product.orderItems.length > 0) {
			// Не удаляем товар, если он есть в завершенных заказах
			const ordersWithProduct = await prisma.order.findMany({
				where: {
					items: {
						some: {
							productId: id,
						},
					},
					status: {
						in: ["COMPLETED", "DELIVERED", "SHIPPED"],
					},
				},
			});

			if (ordersWithProduct.length > 0) {
				return NextResponse.json(
					{
						error: "Невозможно удалить товар, так как он используется в завершенных заказах",
					},
					{ status: 400 }
				);
			}

			// Удаляем товар из незавершенных заказов
			await prisma.orderItem.deleteMany({
				where: {
					productId: id,
					order: {
						status: {
							in: [OrderStatus.PROCESSING, OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
						},
					},
				},
			});
		}

		// 3. Удаление отзывов
		if (product.reviews.length > 0) {
			await prisma.review.deleteMany({
				where: { productId: id },
			});
		}

		// Наконец, удаляем сам товар
		await prisma.product.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting product:", error);
		return NextResponse.json({ error: "Ошибка при удалении товара" }, { status: 500 });
	}
}
