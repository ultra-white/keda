import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, context: { params: { id: string } }) {
	try {
		const { id } = await context.params;

		// Получаем текущую сессию пользователя
		const session = await auth();

		// Проверяем авторизацию
		if (!session || !session.user?.email) {
			return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Получаем пользователя по email
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return new NextResponse(JSON.stringify({ error: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Получаем заказ пользователя по ID
		const order = await prisma.order.findUnique({
			where: {
				id: id,
				userId: user.id, // Проверяем, что заказ принадлежит данному пользователю
			},
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		});

		if (!order) {
			return new NextResponse(JSON.stringify({ error: "Order not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return NextResponse.json(order);
	} catch (error) {
		console.error("Error fetching order details:", error);
		return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}

// Отмена заказа пользователем
export async function PATCH(request: Request, context: { params: { id: string } }) {
	try {
		const { id } = await context.params;

		// Получаем текущую сессию пользователя
		const session = await auth();

		// Проверяем авторизацию
		if (!session || !session.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		// Получаем пользователя по email
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Получаем заказ пользователя по ID
		const order = await prisma.order.findUnique({
			where: {
				id: id,
				userId: user.id, // Проверяем, что заказ принадлежит данному пользователю
			},
		});

		if (!order) {
			return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
		}

		// Проверяем, можно ли отменить заказ (только заказы в статусе PROCESSING или CONFIRMED)
		const cancelableStatuses = ["PROCESSING", "CONFIRMED"];
		if (!cancelableStatuses.includes(order.status)) {
			return NextResponse.json({ error: "Невозможно отменить заказ в текущем статусе" }, { status: 400 });
		}

		// Отменяем заказ
		const updatedOrder = await prisma.order.update({
			where: { id },
			data: { status: "CANCELLED" },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		});

		return NextResponse.json(updatedOrder);
	} catch (error) {
		console.error("Ошибка при отмене заказа:", error);
		return NextResponse.json({ error: "Ошибка при отмене заказа" }, { status: 500 });
	}
}
