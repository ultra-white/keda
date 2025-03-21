import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение всех заказов для админ-панели
export async function GET() {
	try {
		// Получаем текущую сессию пользователя
		const session = await auth();

		// Проверяем авторизацию и роль администратора
		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
		}

		// Получаем все заказы из базы данных с дополнительной информацией
		const orders = await prisma.order.findMany({
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				items: {
					include: {
						product: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(orders);
	} catch (error) {
		console.error("Ошибка при получении заказов:", error);
		return NextResponse.json({ error: "Ошибка при получении заказов" }, { status: 500 });
	}
}
