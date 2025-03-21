import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Публичное получение списка категорий
export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			orderBy: { name: "asc" },
		});

		return NextResponse.json(categories);
	} catch (error) {
		console.error("Error fetching categories:", error);
		return NextResponse.json({ error: "Ошибка при получении категорий" }, { status: 500 });
	}
}
