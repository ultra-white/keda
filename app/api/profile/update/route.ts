import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const { name } = await req.json();

		const updatedUser = await prisma.user.update({
			where: {
				email: session.user.email,
			},
			data: {
				name,
			},
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error("Error updating profile:", error);
		return NextResponse.json({ error: "Ошибка при обновлении профиля" }, { status: 500 });
	}
}
