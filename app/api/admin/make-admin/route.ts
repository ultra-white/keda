import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const { email } = await req.json();

		if (!email) {
			return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
		}

		await prisma.user.update({
			where: { email },
			data: { role: "ADMIN" },
		});

		return NextResponse.json({ message: "Пользователь успешно назначен администратором" });
	} catch (error) {
		console.error("Error making admin:", error);
		return NextResponse.json({ error: "Ошибка при назначении администратора" }, { status: 500 });
	}
}
