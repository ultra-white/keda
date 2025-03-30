import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Session } from "next-auth";

// Типы и константы
type ApiResponse<T = unknown> = NextResponse<T | { error: string } | { success: boolean }>;
type Context = { params: { id: string } };
type UserRole = "ADMIN" | "USER";

interface UserSession extends Session {
	user?: {
		id: string;
		role: UserRole;
		[key: string]: unknown;
	};
}

const USER_SELECT_FIELDS = {
	id: true,
	name: true,
	email: true,
	role: true,
	createdAt: true,
};

// Утилитарные функции
async function verifyAdmin(): Promise<{ session: UserSession; error?: ApiResponse }> {
	const session = (await auth()) as UserSession;

	if (!session?.user || session.user.role !== "ADMIN") {
		return {
			session,
			error: NextResponse.json({ error: "Доступ запрещен" }, { status: 403 }),
		};
	}

	return { session };
}

function handleApiError(operation: string, error: Error | unknown): ApiResponse {
	console.error(`Ошибка при ${operation}:`, error);
	return NextResponse.json({ error: `Ошибка при ${operation}` }, { status: 500 });
}

// GET /api/admin/users/[id] - получение пользователя по ID
export async function GET(_request: NextRequest, context: Context): Promise<ApiResponse> {
	try {
		// Проверка прав администратора
		const { error } = await verifyAdmin();
		if (error) return error;

		const { id: userId } = await context.params;

		// Получение пользователя по ID
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: USER_SELECT_FIELDS,
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error) {
		return handleApiError("получении пользователя", error);
	}
}

// PUT /api/admin/users/[id] - обновление данных пользователя
export async function PUT(request: NextRequest, context: Context): Promise<ApiResponse> {
	try {
		// Проверка прав администратора
		const { session, error } = await verifyAdmin();
		if (error) return error;

		const { id: userId } = await context.params;

		// Получение и валидация данных из запроса
		const { name, email, role } = await request.json();

		if (!name || !email) {
			return NextResponse.json({ error: "Отсутствуют обязательные поля" }, { status: 400 });
		}

		// Поиск пользователя и проверка уникальности email в одной транзакции
		const [existingUser, emailUser] = await Promise.all([
			prisma.user.findUnique({ where: { id: userId } }),
			email ? prisma.user.findUnique({ where: { email } }) : null,
		]);

		if (!existingUser) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Защита от изменения собственного статуса администратора
		if (session.user && session.user.id === userId && existingUser.role === "ADMIN" && role !== "ADMIN") {
			return NextResponse.json({ error: "Нельзя лишить себя прав администратора" }, { status: 400 });
		}

		// Проверка уникальности email (если изменился)
		if (email !== existingUser.email && emailUser) {
			return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
		}

		// Обновление пользователя
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				name,
				email,
				...(role && { role }),
			},
			select: USER_SELECT_FIELDS,
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		return handleApiError("обновлении пользователя", error);
	}
}

// PATCH /api/admin/users/[id] - обновление статуса администратора
export async function PATCH(request: NextRequest, context: Context): Promise<ApiResponse> {
	try {
		// Проверка прав администратора
		const { session, error } = await verifyAdmin();
		if (error) return error;

		const { id: userId } = await context.params;
		const { role } = await request.json();

		if (!role) {
			return NextResponse.json({ error: "Не указана роль пользователя" }, { status: 400 });
		}

		// Защита от изменения собственного статуса администратора
		if (session.user && session.user.id === userId && role !== "ADMIN") {
			return NextResponse.json({ error: "Нельзя лишить себя прав администратора" }, { status: 400 });
		}

		// Обновление статуса администратора
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { role },
			select: USER_SELECT_FIELDS,
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		return handleApiError("обновлении статуса пользователя", error);
	}
}

// DELETE /api/admin/users/[id] - удаление пользователя
export async function DELETE(_request: NextRequest, context: Context): Promise<ApiResponse> {
	try {
		// Проверка прав администратора
		const { session, error } = await verifyAdmin();
		if (error) return error;

		const { id: userId } = await context.params;

		// Защита от удаления своего аккаунта
		if (session.user && session.user.id === userId) {
			return NextResponse.json({ error: "Нельзя удалить свой аккаунт" }, { status: 400 });
		}

		// Проверка существования пользователя и удаление в одной операции
		try {
			await prisma.$transaction(async (tx) => {
				const user = await tx.user.findUnique({ where: { id: userId } });

				if (!user) {
					throw new Error("NOT_FOUND");
				}

				await tx.user.delete({ where: { id: userId } });
			});
		} catch (error: unknown) {
			if (error instanceof Error && error.message === "NOT_FOUND") {
				return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
			}
			throw error; // Перебрасываем для обработки внешним блоком catch
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleApiError("удалении пользователя", error);
	}
}
