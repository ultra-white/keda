import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - добавление товара в корзину
export async function POST(req: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		const data = await req.json();
		const { productId, quantity = 1, selectedSize } = data;

		if (!productId) {
			return NextResponse.json({ error: "Не указан ID товара" }, { status: 400 });
		}

		// Получаем пользователя
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: {
				cart: {
					include: {
						items: true,
					},
				},
			},
		});

		if (!user) {
			try {
				// Создаем нового пользователя
				const newUser = await prisma.user.create({
					data: {
						email: session.user.email!,
						name: session.user.name || "Пользователь",
					},
				});

				// Создаем новую корзину для пользователя
				const newCart = await prisma.cart.create({
					data: {
						userId: newUser.id,
					},
				});

				// Добавляем товар в новую корзину
				await prisma.cartItem.create({
					data: {
						productId: productId,
						quantity: quantity,
						cartId: newCart.id,
						// Преобразуем размер в целое число перед сохранением
						...(selectedSize !== undefined && selectedSize !== null
							? { size: Number.isInteger(selectedSize) ? selectedSize : Math.round(Number(selectedSize)) }
							: {}),
					},
				});

				return NextResponse.json({ success: true, message: "Товар успешно добавлен в корзину" });
			} catch (error) {
				console.error("Ошибка при создании пользователя:", error);
				return NextResponse.json({ error: "Ошибка при создании пользователя" }, { status: 500 });
			}
		}

		// Проверяем существование товара
		const product = await prisma.product.findUnique({
			where: { id: productId },
		});

		if (!product) {
			return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
		}

		// Если у пользователя еще нет корзины, создаем ее
		let cartId = user.cart?.id;
		if (!cartId) {
			const newCart = await prisma.cart.create({
				data: {
					userId: user.id,
				},
			});
			cartId = newCart.id;
		}

		// Создаем уникальный идентификатор для товара с учетом размера
		const productSizeKey = selectedSize ? `${productId}_${selectedSize}` : productId;

		// Проверяем, есть ли товар уже в корзине
		const existingItemIndex = user.cart?.items.findIndex((item) => {
			const itemSizeKey = item.size ? `${item.productId}_${item.size}` : item.productId;
			return itemSizeKey === productSizeKey;
		});

		if (existingItemIndex !== undefined && existingItemIndex >= 0 && user.cart) {
			// Если товар уже есть в корзине, обновляем количество
			const existingItem = user.cart.items[existingItemIndex];
			await prisma.cartItem.update({
				where: { id: existingItem.id },
				data: { quantity: existingItem.quantity + quantity },
			});
		} else {
			// Если товара нет в корзине, добавляем новую запись
			await prisma.cartItem.create({
				data: {
					productId: productId,
					quantity: quantity,
					cartId: cartId,
					// Преобразуем размер в целое число перед сохранением
					...(selectedSize !== undefined && selectedSize !== null
						? { size: Number.isInteger(selectedSize) ? selectedSize : Math.round(Number(selectedSize)) }
						: {}),
				},
			});
		}

		return NextResponse.json({ success: true, message: "Товар успешно добавлен в корзину" });
	} catch (error) {
		console.error("Ошибка при добавлении товара в корзину:", error);
		return NextResponse.json({ error: "Произошла ошибка при добавлении товара в корзину" }, { status: 500 });
	}
}
