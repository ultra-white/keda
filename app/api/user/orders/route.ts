import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

		// Получаем заказы пользователя
		const orders = await prisma.order.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		});

		return NextResponse.json(orders);
	} catch (error) {
		console.error("Error fetching orders:", error);
		return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
