import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Получение всех брендов
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

		const brands = await prisma.brand.findMany({
			orderBy: {
				name: "asc",
			},
		});

		return NextResponse.json(brands);
	} catch (error) {
		console.error("Error fetching brands:", error);
		return NextResponse.json({ error: "Ошибка при получении брендов" }, { status: 500 });
	}
}

// Создание нового бренда
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

		const { name } = await req.json();

		if (!name) {
			return NextResponse.json({ error: "Название бренда обязательно для заполнения" }, { status: 400 });
		}

		// Проверка на существование бренда с таким же названием
		const existingBrand = await prisma.brand.findFirst({
			where: { name: { equals: name, mode: "insensitive" } },
		});

		if (existingBrand) {
			return NextResponse.json({ error: "Бренд с таким названием уже существует" }, { status: 400 });
		}

		const brand = await prisma.brand.create({
			data: {
				name,
			},
		});

		return NextResponse.json(brand);
	} catch (error) {
		console.error("Error creating brand:", error);
		return NextResponse.json({ error: "Ошибка при создании бренда" }, { status: 500 });
	}
}
