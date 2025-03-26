import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/users/[id] - получение пользователя по ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
	try {
		// Проверка прав администратора
		const session = await auth();
		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
		}

		const userId = context.params.id;

		// Получение пользователя по ID
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error) {
		console.error("Ошибка при получении пользователя:", error);
		return NextResponse.json({ error: "Ошибка при получении пользователя" }, { status: 500 });
	}
}

// PUT /api/admin/users/[id] - обновление данных пользователя
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
	try {
		// Проверка прав администратора
		const session = await auth();
		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
		}

		// Получение данных из запроса
		const data = await request.json();
		const { name, email, role } = data;

		// Проверка обязательных полей
		if (!name || !email) {
			return NextResponse.json({ error: "Отсутствуют обязательные поля" }, { status: 400 });
		}

		const userId = context.params.id;

		// Проверка существования пользователя с таким ID
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!existingUser) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Защита от изменения собственного статуса администратора
		if (session?.user?.id === userId && existingUser.role === "ADMIN" && role !== "ADMIN") {
			return NextResponse.json({ error: "Нельзя лишить себя прав администратора" }, { status: 400 });
		}

		// Проверка уникальности email (если изменился)
		if (email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email },
			});

			if (emailExists) {
				return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
			}
		}

		// Обновление пользователя
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				name,
				email,
				...(role && { role }),
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error("Ошибка при обновлении пользователя:", error);
		return NextResponse.json({ error: "Ошибка при обновлении пользователя" }, { status: 500 });
	}
}

// PATCH /api/admin/users/[id] - обновление статуса администратора
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
	try {
		// Проверка прав администратора
		const session = await auth();
		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
		}

		const userId = context.params.id;
		const data = await request.json();

		// Защита от изменения собственного статуса администратора
		if (session?.user?.id === userId && data.role !== "ADMIN") {
			return NextResponse.json({ error: "Нельзя лишить себя прав администратора" }, { status: 400 });
		}

		// Обновление статуса администратора
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { role: data.role },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
			},
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error("Ошибка при обновлении пользователя:", error);
		return NextResponse.json({ error: "Ошибка при обновлении пользователя" }, { status: 500 });
	}
}

// DELETE /api/admin/users/[id] - удаление пользователя
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
	try {
		// Проверка прав администратора
		const session = await auth();
		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
		}

		const { id: userId } = context.params;

		// Защита от удаления своего аккаунта
		if (session?.user?.id === userId) {
			return NextResponse.json({ error: "Нельзя удалить свой аккаунт" }, { status: 400 });
		}

		// Проверка существования пользователя
		const userExists = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				cart: {
					include: {
						items: true,
					},
				},
				orders: {
					include: {
						items: true,
					},
				},
				reviews: true,
			},
		});

		if (!userExists) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Удаление связанных записей перед удалением пользователя
		// Удаляем отзывы пользователя
		if (userExists.reviews.length > 0) {
			await prisma.review.deleteMany({
				where: { userId },
			});
		}

		// Удаляем элементы корзины и саму корзину
		if (userExists.cart) {
			if (userExists.cart.items.length > 0) {
				await prisma.cartItem.deleteMany({
					where: { cartId: userExists.cart.id },
				});
			}
			await prisma.cart.delete({
				where: { userId },
			});
		}

		// Обработка заказов
		if (userExists.orders.length > 0) {
			// Для каждого заказа удаляем его элементы
			for (const order of userExists.orders) {
				await prisma.orderItem.deleteMany({
					where: { orderId: order.id },
				});
			}

			// Затем удаляем сами заказы
			await prisma.order.deleteMany({
				where: { userId },
			});
		}

		// Теперь можно безопасно удалить пользователя
		await prisma.user.delete({
			where: { id: userId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Ошибка при удалении пользователя:", error);
		return NextResponse.json({ error: "Ошибка при удалении пользователя" }, { status: 500 });
	}
}
