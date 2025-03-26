import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Context = {
	params: {
		id: string;
	};
};

// Получение конкретного бренда
export async function GET(req: NextRequest, { params }: Context) {
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

		const brand = await prisma.brand.findUnique({
			where: { id: params.id },
		});

		if (!brand) {
			return NextResponse.json({ error: "Бренд не найден" }, { status: 404 });
		}

		return NextResponse.json(brand);
	} catch (error) {
		console.error("Error fetching brand:", error);
		return NextResponse.json({ error: "Ошибка при получении бренда" }, { status: 500 });
	}
}

// Обновление бренда
export async function PUT(req: NextRequest, { params }: Context) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: {
				email: session.user.email,
			},
			select: {
				id: true,
				email: true,
				role: true,
			},
		});

		if (!user || user.role !== "ADMIN") {
			return NextResponse.json({ error: "У вас нет прав на выполнение этого действия" }, { status: 403 });
		}

		const { name } = await req.json();

		if (!name) {
			return NextResponse.json({ error: "Название бренда обязательно для заполнения" }, { status: 400 });
		}

		// Получаем id параметр
		const id = params.id;

		// Проверка на существование бренда
		const brand = await prisma.brand.findUnique({
			where: { id },
		});

		if (!brand) {
			return NextResponse.json({ error: "Бренд не найден" }, { status: 404 });
		}

		// Проверка на существование другого бренда с таким же названием
		const existingBrand = await prisma.brand.findFirst({
			where: {
				name: { equals: name },
				id: { not: id },
			},
		});

		if (existingBrand) {
			return NextResponse.json({ error: "Бренд с таким названием уже существует" }, { status: 400 });
		}

		const updatedBrand = await prisma.brand.update({
			where: { id },
			data: {
				name,
			},
		});

		return NextResponse.json(updatedBrand);
	} catch (error) {
		console.error("Error updating brand:", error);
		return NextResponse.json({ error: "Ошибка при обновлении бренда" }, { status: 500 });
	}
}

// Удаление бренда
export async function DELETE(req: NextRequest, { params }: Context) {
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

		// Проверка на существование бренда
		const brand = await prisma.brand.findUnique({
			where: { id: params.id },
		});

		if (!brand) {
			return NextResponse.json({ error: "Бренд не найден" }, { status: 404 });
		}

		// Проверка, используется ли бренд в продуктах
		const productsCount = await prisma.product.count({
			where: { brandId: params.id },
		});

		if (productsCount > 0) {
			return NextResponse.json({ error: "Нельзя удалить бренд, который используется в товарах" }, { status: 400 });
		}

		await prisma.brand.delete({
			where: { id: params.id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting brand:", error);
		return NextResponse.json({ error: "Ошибка при удалении бренда" }, { status: 500 });
	}
}
