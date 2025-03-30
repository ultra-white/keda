import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - удаление товара из корзины
export async function POST(req: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const data = await req.json();
		const { productId, selectedSize } = data;

		if (!productId) {
			return NextResponse.json({ error: "Не указан ID товара" }, { status: 400 });
		}

		// Получаем пользователя
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: {
				cart: {
					include: {
						items: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		if (!user.cart) {
			return NextResponse.json({ error: "Корзина не найдена" }, { status: 404 });
		}

		// Находим товар в корзине
		const cartItem = user.cart.items.find((item) => {
			// Проверяем наличие свойства size в базе данных
			if (selectedSize !== undefined && selectedSize !== null && item.size !== null) {
				// Преобразуем оба значения в числа для корректного сравнения
				const itemSize = Number(item.size);
				const requestSize = Number(selectedSize);
				return item.productId === productId && itemSize === requestSize;
			} else if (
				(selectedSize === undefined || selectedSize === null) &&
				(item.size === undefined || item.size === null)
			) {
				return item.productId === productId;
			}
			return false;
		});

		if (!cartItem) {
			return NextResponse.json({ error: "Товар не найден в корзине" }, { status: 404 });
		}

		// Удаляем товар из корзины
		await prisma.cartItem.delete({
			where: { id: cartItem.id },
		});

		return NextResponse.json({ success: true, message: "Товар удален из корзины" });
	} catch (error) {
		console.error("Ошибка при удалении товара из корзины:", error);
		return NextResponse.json({ error: "Произошла ошибка при удалении товара из корзины" }, { status: 500 });
	}
}
