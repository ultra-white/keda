import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение информации о конкретном заказе
export async function GET(request: NextRequest, context: { params: { id: string } }) {
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

		// Получаем ID заказа из параметров
		const { id: orderId } = await context.params;

		// Получаем заказ по ID
		const order = await prisma.order.findUnique({
			where: { id: orderId },
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
		});

		if (!order) {
			return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error("Ошибка при получении информации о заказе:", error);
		return NextResponse.json({ error: "Ошибка при получении информации о заказе" }, { status: 500 });
	}
}

// Обновление статуса заказа
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
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

		// Получаем ID заказа из параметров
		const { id: orderId } = await context.params;

		// Получаем данные для обновления из запроса
		const data = await request.json();
		const { status } = data;

		if (!status) {
			return NextResponse.json({ error: "Необходимо указать статус заказа" }, { status: 400 });
		}

		// Проверяем, что статус имеет допустимое значение
		const validStatuses = ["PROCESSING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json({ error: "Недопустимый статус заказа" }, { status: 400 });
		}

		// Обновляем статус заказа
		const updatedOrder = await prisma.order.update({
			where: { id: orderId },
			data: { status },
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
		});

		return NextResponse.json(updatedOrder);
	} catch (error) {
		console.error("Ошибка при обновлении статуса заказа:", error);
		return NextResponse.json({ error: "Ошибка при обновлении статуса заказа" }, { status: 500 });
	}
}

// Удаление заказа
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
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

		// Получаем ID заказа из параметров
		const { id: orderId } = await context.params;

		// Проверяем существование заказа
		const order = await prisma.order.findUnique({
			where: { id: orderId },
		});

		if (!order) {
			return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
		}

		// Удаляем сначала все элементы заказа, потом сам заказ
		await prisma.$transaction([
			prisma.orderItem.deleteMany({
				where: { orderId },
			}),
			prisma.order.delete({
				where: { id: orderId },
			}),
		]);

		return NextResponse.json({ success: true, message: "Заказ успешно удален" });
	} catch (error) {
		console.error("Ошибка при удалении заказа:", error);
		return NextResponse.json({ error: "Ошибка при удалении заказа" }, { status: 500 });
	}
}
