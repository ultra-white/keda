import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение категории по ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
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

		const category = await prisma.category.findUnique({
			where: { id: params.id },
		});

		if (!category) {
			return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
		}

		return NextResponse.json(category);
	} catch (error) {
		console.error("Error fetching category:", error);
		return NextResponse.json({ error: "Ошибка при получении категории" }, { status: 500 });
	}
}

// Обновление категории
export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

		if (!name || !slug) {
			return NextResponse.json({ error: "Название и URL категории обязательны" }, { status: 400 });
		}

		// Проверка на существование категории
		const id = params.id;
		const category = await prisma.category.findUnique({
			where: { id },
		});

		if (!category) {
			return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
		}

		// Проверка на существование другой категории с таким же названием
		const existingCategory = await prisma.category.findFirst({
			where: {
				name: { equals: name, mode: "insensitive" },
				id: { not: id },
			},
		});

		if (existingCategory) {
			return NextResponse.json({ error: "Категория с таким названием уже существует" }, { status: 400 });
		}

		const updatedCategory = await prisma.category.update({
			where: { id },
			data: {
				name,
				slug,
			},
		});

		return NextResponse.json(updatedCategory);
	} catch (error) {
		console.error("Error updating category:", error);
		return NextResponse.json({ error: "Ошибка при обновлении категории" }, { status: 500 });
	}
}

// Удаление категории
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

		// Проверка существования категории
		const category = await prisma.category.findUnique({
			where: { id: params.id },
		});

		if (!category) {
			return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });
		}

		// Проверка, есть ли товары в этой категории
		const productsCount = await prisma.product.count({
			where: { categoryId: params.id },
		});

		if (productsCount > 0) {
			return NextResponse.json(
				{
					error: `Невозможно удалить категорию, так как она содержит ${productsCount} товаров`,
				},
				{ status: 400 }
			);
		}

		await prisma.category.delete({
			where: { id: params.id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting category:", error);
		return NextResponse.json({ error: "Ошибка при удалении категории" }, { status: 500 });
	}
}
