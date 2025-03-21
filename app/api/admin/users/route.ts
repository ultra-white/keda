import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/admin/users - получение списка всех пользователей
export async function GET() {
	try {
		// Проверка прав администратора
		const session = await auth();
		if (!session?.user || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
		}

		// Получение всех пользователей из базы данных
		const users = await prisma.user.findMany({
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(users);
	} catch (error) {
		console.error("Ошибка при получении пользователей:", error);
		return NextResponse.json({ error: "Ошибка при получении пользователей" }, { status: 500 });
	}
}
