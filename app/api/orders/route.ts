import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
	try {
		// Получаем текущую сессию пользователя
		const session = await auth();

		// Проверяем авторизацию
		if (!session || !session.user?.email) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Получаем данные заказа из запроса
		const data = await request.json();
		const { items, totalAmount } = data;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return new NextResponse(JSON.stringify({ error: "Некорректные данные заказа" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Находим пользователя
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return new NextResponse(JSON.stringify({ error: "Пользователь не найден" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Создаем заказ в базе данных
		const order = await prisma.order.create({
			data: {
				userId: user.id,
				status: OrderStatus.PROCESSING, // Начальный статус
				total: totalAmount,
				items: {
					create: items.map(
						(item: {
							product: {
								id: string;
								price: number;
								selectedSize?: number | null;
							};
							quantity: number;
						}) => {
							// Преобразуем размер в число для соответствия схеме
							let sizeValue = 40; // Значение по умолчанию

							if (item.product.selectedSize !== undefined && item.product.selectedSize !== null) {
								// Пытаемся получить число
								const size = Number(item.product.selectedSize);
								if (!isNaN(size)) {
									sizeValue = Math.round(size);
								}
							}

							return {
								productId: item.product.id,
								price: item.product.price,
								quantity: item.quantity,
								size: sizeValue, // Теперь передаем число, а не строку
							};
						}
					),
				},
			},
			include: {
				items: true,
			},
		});

		return new NextResponse(JSON.stringify(order), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		// Только минимально необходимое сообщение об ошибке
		return new NextResponse(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
