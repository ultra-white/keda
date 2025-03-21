import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Удаление отдельного товара из заказа
export async function DELETE(request: Request, { params }: { params: { id: string; itemId: string } }) {
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

		// Получаем ID заказа и ID товара из параметров
		const orderId = params.id;
		const orderItemId = params.itemId;

		// Получаем заказ
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: true,
			},
		});

		if (!order) {
			return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
		}

		// Проверяем, существует ли товар в заказе
		const orderItem = await prisma.orderItem.findUnique({
			where: { id: orderItemId },
		});

		if (!orderItem || orderItem.orderId !== orderId) {
			return NextResponse.json({ error: "Товар не найден в заказе" }, { status: 404 });
		}

		// Не позволяем удалить последний товар в заказе
		if (order.items.length <= 1) {
			return NextResponse.json(
				{ error: "Невозможно удалить единственный товар в заказе. Удалите весь заказ." },
				{ status: 400 }
			);
		}

		// Получаем текущую стоимость товара
		const itemTotal = orderItem.price * orderItem.quantity;

		// Удаляем товар из заказа в транзакции и обновляем общую стоимость заказа
		await prisma.$transaction([
			prisma.orderItem.delete({
				where: { id: orderItemId },
			}),
			prisma.order.update({
				where: { id: orderId },
				data: {
					total: {
						decrement: itemTotal,
					},
				},
			}),
		]);

		// Получаем обновленный заказ для возврата клиенту
		const updatedOrder = await prisma.order.findUnique({
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

		return NextResponse.json(updatedOrder);
	} catch (error) {
		console.error("Ошибка при удалении товара из заказа:", error);
		return NextResponse.json({ error: "Ошибка при удалении товара из заказа" }, { status: 500 });
	}
}
