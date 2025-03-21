import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - удаление товара из корзины
export async function POST(req: Request) {
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
			if (selectedSize && item.size) {
				return item.productId === productId && item.size === String(selectedSize);
			} else if (!selectedSize && !item.size) {
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
