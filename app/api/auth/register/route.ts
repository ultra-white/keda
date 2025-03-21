import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const { email, password, name } = await req.json();

		if (!email || !password) {
			return NextResponse.json({ error: "Необходимо указать email и пароль" }, { status: 400 });
		}

		// Проверяем, существует ли пользователь
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
		}

		// Хешируем пароль
		const hashedPassword = await hash(password, 10);

		// Создаем пользователя
		const user = await prisma.user.create({
			data: {
				email,
				password: hashedPassword,
				name,
				role: "USER",
			},
		});

		// Создаем корзину для нового пользователя
		await prisma.cart.create({
			data: {
				userId: user.id,
			},
		});

		return NextResponse.json({ message: "Пользователь успешно создан" }, { status: 201 });
	} catch (error) {
		console.error("Error in register route:", error);
		return NextResponse.json({ error: "Ошибка при создании пользователя" }, { status: 500 });
	}
}
