import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - очистка корзины
export async function POST() {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
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

		if (!user.cart) {
			return NextResponse.json({ success: true, message: "Корзина уже пуста" });
		}

		// Удаляем все товары из корзины
		await prisma.cartItem.deleteMany({
			where: {
				cartId: user.cart.id,
			},
		});

		return NextResponse.json({ success: true, message: "Корзина очищена" });
	} catch (error) {
		console.error("Ошибка при очистке корзины:", error);
		return NextResponse.json({ error: "Произошла ошибка при очистке корзины" }, { status: 500 });
	}
}
