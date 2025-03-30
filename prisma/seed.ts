import { PrismaClient, Role, OrderStatus } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
	console.log(`Начало заполнения базы данных...`);

	// Очистка существующих данных
	await prisma.cartItem.deleteMany();
	await prisma.cart.deleteMany();
	await prisma.orderItem.deleteMany();
	await prisma.order.deleteMany();
	await prisma.product.deleteMany();
	await prisma.category.deleteMany();
	await prisma.brand.deleteMany();
	await prisma.user.deleteMany();

	console.log("База данных очищена");

	// Создание администратора
	const adminPassword = await hash("admin", 10);
	const admin = await prisma.user.create({
		data: {
			email: "admin@example.com",
			name: "Администратор",
			password: adminPassword,
			role: Role.ADMIN,
		},
	});

	console.log(`Создан пользователь admin: ${admin.id}`);

	// Создание обычного пользователя
	const userPassword = await hash("user", 10);
	const user = await prisma.user.create({
		data: {
			email: "user@example.com",
			name: "Тестовый пользователь",
			password: userPassword,
			role: Role.USER,
		},
	});

	console.log(`Создан пользователь user: ${user.id}`);

	// Создание категорий
	const categories = await Promise.all([
		prisma.category.create({
			data: {
				name: "Мужские",
				slug: "men",
			},
		}),
		prisma.category.create({
			data: {
				name: "Женские",
				slug: "women",
			},
		}),
		prisma.category.create({
			data: {
				name: "Детские",
				slug: "kids",
			},
		}),
	]);

	console.log(`Созданы категории: ${categories.map((c) => c.name).join(", ")}`);

	// Создание брендов
	const brands = await Promise.all([
		prisma.brand.create({
			data: {
				name: "Nike",
			},
		}),
		prisma.brand.create({
			data: {
				name: "Adidas",
			},
		}),
		prisma.brand.create({
			data: {
				name: "Puma",
			},
		}),
		prisma.brand.create({
			data: {
				name: "Reebok",
			},
		}),
	]);

	console.log(`Созданы бренды: ${brands.map((b) => b.name).join(", ")}`);

	// Создание товаров - Men
	const menProducts = [
		{
			brandId: brands[0].id, // Nike
			brandName: "Nike",
			model: "Air Force 1",
			price: 9990,
			oldPrice: 11990,
			description: "Классические кроссовки Nike Air Force 1 в белом цвете. Кожаный верх, амортизирующая подошва.",
			image:
				"https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fi8.amplience.net%2Fi%2Fjpl%2Fjd_030664_a%3Fv%3D1&f=1&nofb=1&ipt=c3ce964e0e3e2d1b0733a1b7c452bea988cf93352e76e6006ba4e2e4da1cae00&ipo=images",
			isNew: false,
			isOnSale: true,
			categoryId: categories[0].id, // Men
		},
		{
			brandId: brands[1].id, // Adidas
			brandName: "Adidas",
			model: "Ultra Boost",
			price: 12990,
			description: "Беговые кроссовки Adidas Ultra Boost с технологией Boost для максимальной амортизации.",
			image: "https://i.postimg.cc/635W9jFG/image.png",
			isNew: true,
			isOnSale: false,
			categoryId: categories[0].id, // Men
		},
		{
			brandId: brands[2].id, // Puma
			brandName: "Puma",
			model: "Suede Classic",
			price: 6990,
			oldPrice: 8990,
			description: "Классические кроссовки Puma Suede с замшевым верхом. Подходят для повседневной носки.",
			image: "https://i.postimg.cc/rp5j8g5c/image.png",
			isNew: false,
			isOnSale: true,
			categoryId: categories[0].id, // Men
		},
	];

	// Создание товаров - Women
	const womenProducts = [
		{
			brandId: brands[0].id, // Nike
			brandName: "Nike",
			model: "Air Max 270",
			price: 11990,
			description: "Женские кроссовки Nike Air Max 270 с воздушной подушкой увеличенного размера для комфорта.",
			image: "https://i.postimg.cc/HsCymHBJ/image.png",
			isNew: true,
			isOnSale: false,
			categoryId: categories[1].id, // Women
		},
		{
			brandId: brands[1].id, // Adidas
			brandName: "Adidas",
			model: "Stan Smith",
			price: 7990,
			oldPrice: 9990,
			description: "Классические женские кроссовки Adidas Stan Smith из белой кожи с перфорацией.",
			image: "https://i.postimg.cc/KzPmDXLV/image.png",
			isNew: false,
			isOnSale: true,
			categoryId: categories[1].id, // Women
		},
		{
			brandId: brands[3].id, // Reebok
			brandName: "Reebok",
			model: "Classic Leather",
			price: 5990,
			description: "Женские кроссовки Reebok Classic Leather с мягким кожаным верхом и удобной стелькой.",
			image: "https://i.postimg.cc/ht2shh5Z/image.png",
			isNew: false,
			isOnSale: false,
			categoryId: categories[1].id, // Women
		},
	];

	// Создание товаров - Kids
	const kidsProducts = [
		{
			brandId: brands[0].id, // Nike
			brandName: "Nike",
			model: "Air Max Kids",
			price: 5990,
			description: "Детские кроссовки Nike Air Max с амортизирующей подошвой и яркими цветами.",
			image: "https://i.postimg.cc/HL5rRhX0/image.png",
			isNew: true,
			isOnSale: false,
			categoryId: categories[2].id, // Kids
		},
		{
			brandId: brands[1].id, // Adidas
			brandName: "Adidas",
			model: "Superstar Kids",
			price: 4990,
			oldPrice: 6990,
			description: "Детские кроссовки Adidas Superstar с узнаваемым дизайном и прочной подошвой.",
			image: "https://i.postimg.cc/DZwKLWvW/image.png",
			isNew: false,
			isOnSale: true,
			categoryId: categories[2].id, // Kids
		},
	];

	// Объединяем все товары
	const allProducts = [...menProducts, ...womenProducts, ...kidsProducts];

	// Создаем товары в базе данных
	const createdProducts = [];
	for (const product of allProducts) {
		const createdProduct = await prisma.product.create({ data: product });
		createdProducts.push(createdProduct);
	}

	console.log(`Создано ${allProducts.length} товаров`);

	// Создание корзины для пользователя
	const cart = await prisma.cart.create({
		data: {
			userId: user.id,
		},
	});

	// Добавление товаров в корзину пользователя
	await prisma.cartItem.create({
		data: {
			cartId: cart.id,
			productId: createdProducts[0].id, // Nike Air Force 1
			quantity: 1,
			size: "42",
		},
	});

	await prisma.cartItem.create({
		data: {
			cartId: cart.id,
			productId: createdProducts[3].id, // Nike Air Max 270 (Женские)
			quantity: 1,
			size: "38",
		},
	});

	console.log(`Создана корзина с 2 товарами для пользователя user`);

	// Создание заказов для пользователя
	// Первый заказ - обработанный
	const order1 = await prisma.order.create({
		data: {
			userId: user.id,
			status: OrderStatus.PROCESSING,
			total: createdProducts[1].price + createdProducts[6].price * 2,
		},
	});

	// Добавление товаров в первый заказ
	await prisma.orderItem.create({
		data: {
			orderId: order1.id,
			productId: createdProducts[1].id, // Adidas Ultra Boost
			quantity: 1,
			price: createdProducts[1].price,
			size: "43",
		},
	});

	await prisma.orderItem.create({
		data: {
			orderId: order1.id,
			productId: createdProducts[6].id, // Air Max Kids
			quantity: 2,
			price: createdProducts[6].price,
			size: "32",
		},
	});

	// Второй заказ - доставленный
	const order2 = await prisma.order.create({
		data: {
			userId: user.id,
			status: OrderStatus.DELIVERED,
			total: createdProducts[2].price + createdProducts[4].price,
		},
	});

	// Добавление товаров во второй заказ
	await prisma.orderItem.create({
		data: {
			orderId: order2.id,
			productId: createdProducts[2].id, // Puma Suede Classic
			quantity: 1,
			price: createdProducts[2].price,
			size: "42",
		},
	});

	await prisma.orderItem.create({
		data: {
			orderId: order2.id,
			productId: createdProducts[4].id, // Adidas Stan Smith
			quantity: 1,
			price: createdProducts[4].price,
			size: "37",
		},
	});

	console.log(`Создано 2 заказа для пользователя user`);

	console.log(`Заполнение базы данных завершено!`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
