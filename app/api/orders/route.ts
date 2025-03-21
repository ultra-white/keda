import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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
				status: "PROCESSING", // Начальный статус
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
						}) => ({
							productId: item.product.id,
							price: item.product.price,
							quantity: item.quantity,
							size: item.product.selectedSize ? String(item.product.selectedSize) : null,
						})
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
		console.error("Ошибка при создании заказа:", error);
		return new NextResponse(JSON.stringify({ error: "Внутренняя ошибка сервера" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
