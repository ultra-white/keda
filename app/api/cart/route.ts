import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - получение корзины пользователя
export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		// Получаем пользователя
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			include: {
				cart: {
					include: {
						items: {
							include: {
								product: {
									include: {
										category: true,
										brand: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
		}

		// Если у пользователя нет корзины, возвращаем пустой массив
		if (!user.cart) {
			return NextResponse.json({ items: [] });
		}

		// Форматируем данные для возврата
		const cartItems = user.cart.items.map((item) => ({
			product: {
				...item.product,
				// Преобразуем даты в строки для JSON
				createdAt: item.product.createdAt.toISOString(),
				updatedAt: item.product.updatedAt.toISOString(),
				// Добавляем размер в продукт
				selectedSize: item.size, // Размер уже хранится как Int в БД
				// Убедимся, что цены обрабатываются правильно
				price: item.product.price, // Цена хранится как Int в БД
				oldPrice: item.product.oldPrice, // Старая цена тоже хранится как Int (или null)
			},
			quantity: item.quantity,
		}));

		return NextResponse.json({ items: cartItems });
	} catch (error) {
		return NextResponse.json({ error: "Произошла ошибка при получении корзины" }, { status: 500 });
	}
}

// POST - обновление корзины пользователя
export async function POST(req: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
		}

		let data;
		try {
			data = await req.json();
		} catch (parseError) {
			return NextResponse.json({ error: "Неверный формат JSON" }, { status: 400 });
		}

		if (!data || !data.items || !Array.isArray(data.items)) {
			return NextResponse.json({ error: "Неверный формат данных: ожидается массив товаров" }, { status: 400 });
		}

		const { items } = data;

		// Валидируем каждый элемент
		for (const item of items) {
			if (!item.product || !item.product.id || !item.quantity) {
				return NextResponse.json(
					{
						error: "Некорректный формат элемента корзины: отсутствуют обязательные поля",
					},
					{ status: 400 }
				);
			}
		}

		// Используем одну транзакцию
		try {
			return await prisma.$transaction(
				async (tx) => {
					// 1. Получаем пользователя
					const user = await tx.user.findUnique({
						where: { email: session.user.email },
						include: { cart: true },
					});

					if (!user) {
						return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
					}

					// 2. Получаем или создаем корзину
					let cart = user.cart;
					if (!cart) {
						try {
							cart = await tx.cart.create({
								data: { userId: user.id },
							});
						} catch (createError) {
							return NextResponse.json({ error: "Не удалось создать корзину" }, { status: 500 });
						}
					}

					// 3. Удаляем все существующие товары
					try {
						await tx.cartItem.deleteMany({
							where: { cartId: cart.id },
						});
					} catch (deleteError) {
						return NextResponse.json({ error: "Не удалось очистить корзину" }, { status: 500 });
					}

					// 4. Добавляем новые товары по одному - так надежнее
					for (const item of items) {
						try {
							// Проверяем, что товар существует
							const productExists = await tx.product.findUnique({
								where: { id: item.product.id },
								select: { id: true },
							});

							if (!productExists) {
								continue;
							}

							// Преобразуем значения полей в правильные типы
							const quantity = parseInt(String(item.quantity), 10) || 1;

							// Размер должен быть числом
							let size = 40; // Значение по умолчанию
							if (item.product.selectedSize !== undefined && item.product.selectedSize !== null) {
								size = parseInt(String(item.product.selectedSize), 10) || 40;
							}

							// Создаем элемент корзины
							await tx.cartItem.create({
								data: {
									cartId: cart.id,
									productId: item.product.id,
									quantity: quantity,
									size: size,
								},
							});
						} catch (itemError) {
							// Продолжаем с другими товарами, не прерывая всю транзакцию
						}
					}

					return NextResponse.json({ success: true, message: "Корзина успешно обновлена" });
				},
				{
					// Опции транзакции для увеличения вероятности успеха
					maxWait: 10000, // 10s максимальное время ожидания
					timeout: 20000, // 20s таймаут транзакции
				}
			);
		} catch (txError) {
			return NextResponse.json({ error: "Ошибка при обновлении корзины" }, { status: 500 });
		}
	} catch (error) {
		return NextResponse.json({ error: "Произошла ошибка при обновлении корзины" }, { status: 500 });
	}
}
