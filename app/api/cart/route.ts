import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получение корзины пользователя
export async function GET(req: Request) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		// Получаем пользователя
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: {
				cart: {
					include: {
						items: {
							include: {
								product: {
									include: {
										category: true,
										brand: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Если у пользователя нет корзины, возвращаем пустой массив
		if (!user.cart) {
			return NextResponse.json({ items: [] });
		}

		// Форматируем данные для возврата
		const cartItems = user.cart.items.map((item) => ({
			product: {
				...item.product,
				createdAt: item.product.createdAt.toISOString(),
				updatedAt: item.product.updatedAt.toISOString(),
				// Добавляем размер в продукт, если он есть
				...(item.size ? { selectedSize: parseInt(item.size) || item.size } : {}),
			},
			quantity: item.quantity,
		}));

		return NextResponse.json({ items: cartItems });
	} catch (error) {
		console.error("Ошибка при получении корзины:", error);
		return NextResponse.json({ error: "Произошла ошибка при получении корзины" }, { status: 500 });
	}
}

// POST - обновление корзины пользователя
export async function POST(req: Request) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const data = await req.json();
		const { items } = data;

		if (!Array.isArray(items)) {
			return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
		}

		// Получаем пользователя
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: {
				cart: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Если у пользователя еще нет корзины, создаем ее
		let cartId = user.cart?.id;
		if (!cartId) {
			const newCart = await prisma.cart.create({
				data: {
					userId: user.id,
				},
			});
			cartId = newCart.id;
		} else {
			// Удаляем все существующие товары в корзине
			await prisma.cartItem.deleteMany({
				where: {
					cartId: cartId,
				},
			});
		}

		// Добавляем новые товары в корзину
		const cartItems = [];
		for (const item of items) {
			const { product, quantity } = item;

			// Проверяем существование товара
			const existingProduct = await prisma.product.findUnique({
				where: { id: product.id },
			});

			if (existingProduct) {
				const cartItem = await prisma.cartItem.create({
					data: {
						productId: product.id,
						quantity: quantity,
						cartId: cartId,
						// Проверяем, поддерживает ли схема БД поле size
						...(product.selectedSize ? { size: String(product.selectedSize) } : {}),
					},
				});
				cartItems.push(cartItem);
			}
		}

		return NextResponse.json({ success: true, message: "Корзина успешно обновлена" });
	} catch (error) {
		console.error("Ошибка при обновлении корзины:", error);
		return NextResponse.json({ error: "Произошла ошибка при обновлении корзины" }, { status: 500 });
	}
}
