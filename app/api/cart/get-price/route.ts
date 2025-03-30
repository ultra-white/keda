import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - получение информации о цене товара
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const productId = searchParams.get("id");

		if (!productId) {
			return NextResponse.json({ error: "Не указан ID товара" }, { status: 400 });
		}

		const product = await prisma.product.findUnique({
			where: { id: productId },
			select: {
				id: true,
				price: true,
				oldPrice: true,
				model: true,
				brandName: true,
			},
		});

		if (!product) {
			return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
		}

		// Возвращаем информацию о товаре
		return NextResponse.json({
			product: {
				id: product.id,
				price: product.price,
				oldPrice: product.oldPrice,
				model: product.model,
				brandName: product.brandName,
			},
		});
	} catch (error) {
		console.error("Ошибка при получении информации о цене товара:", error);
		return NextResponse.json({ error: "Произошла ошибка при получении информации о товаре" }, { status: 500 });
	}
}
