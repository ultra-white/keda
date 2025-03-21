import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение списка категорий
export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
		}

		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
		});

		return NextResponse.json(categories);
	} catch (error) {
		console.error("Error fetching categories:", error);
		return NextResponse.json({ error: "Ошибка при получении категорий" }, { status: 500 });
	}
}

// Создание новой категории
export async function POST(req: Request) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (user?.role !== "ADMIN") {
			return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
		}

		const { name, slug } = await req.json();

		// Проверяем уникальность slug
		const existingCategory = await prisma.category.findUnique({
			where: { slug },
		});

		if (existingCategory) {
			return NextResponse.json({ error: "Категория с таким URL уже существует" }, { status: 400 });
		}

		const category = await prisma.category.create({
			data: {
				name,
				slug,
			},
		});

		return NextResponse.json(category, { status: 201 });
	} catch (error) {
		console.error("Error creating category:", error);
		return NextResponse.json({ error: "Ошибка при создании категории" }, { status: 500 });
	}
}
