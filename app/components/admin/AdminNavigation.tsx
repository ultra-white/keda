"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Folder, ShoppingBag, Users, Home, Tag, Package } from "lucide-react";

// Конфигурация разделов админ-панели
const adminSections = [
	{
		id: "dashboard",
		title: "Панель управления",
		path: "/admin",
		icon: Home,
	},
	{
		id: "products",
		title: "Товары",
		path: "/admin/products",
		icon: ShoppingBag,
	},
	{
		id: "categories",
		title: "Категории",
		path: "/admin/categories",
		icon: Folder,
	},
	{
		id: "brands",
		title: "Бренды",
		path: "/admin/brands",
		icon: Tag,
	},
	{
		id: "orders",
		title: "Заказы",
		path: "/admin/orders",
		icon: Package,
	},
	{
		id: "users",
		title: "Пользователи",
		path: "/admin/users",
		icon: Users,
	},
];

export default function AdminNavigation() {
	const pathname = usePathname();

	// Определяем текущий активный раздел
	const activeSection = adminSections.find((section) => {
		if (section.id === "dashboard") {
			// Для панели управления - активна только если путь точно совпадает
			return pathname === section.path;
		}
		// Для других разделов - если путь совпадает или начинается с него
		return pathname === section.path || pathname.startsWith(`${section.path}/`);
	});

	// Формируем хлебные крошки
	const breadcrumbs = [{ title: "Панель управления", path: "/admin" }];

	if (activeSection && activeSection.id !== "dashboard") {
		breadcrumbs.push({
			title: activeSection.title,
			path: activeSection.path,
		});
	}

	return (
		<div className='mb-6'>
			{/* Навигационное меню */}
			<nav className='bg-white shadow-sm rounded-md mb-4'>
				<div className='flex justify-between sm:h-14'>
					<div className='flex'>
						<div className='hidden sm:ml-6 sm:flex sm:space-x-4'>
							{adminSections.map((section) => {
								// Корректируем логику проверки активного раздела
								let isActive;
								if (section.id === "dashboard") {
									// Для панели управления - активна только если путь точно совпадает
									isActive = pathname === section.path;
								} else {
									// Для других разделов - если путь совпадает или начинается с него
									isActive = pathname === section.path || pathname.startsWith(`${section.path}/`);
								}

								return (
									<Link
										key={section.id}
										href={section.path}
										className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
											isActive
												? "border-indigo-500 text-gray-900"
												: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
										}`}
									>
										<section.icon className={`mr-2 h-5 w-5 ${isActive ? "text-indigo-500" : "text-gray-400"}`} />
										{section.title}
									</Link>
								);
							})}
						</div>
					</div>
				</div>

				{/* Мобильное меню */}
				<div className='sm:hidden py-2'>
					<div className='px-2 pt-2 pb-3 space-y-1'>
						{adminSections.map((section) => {
							// Применяем ту же логику для мобильного меню
							let isActive;
							if (section.id === "dashboard") {
								isActive = pathname === section.path;
							} else {
								isActive = pathname === section.path || pathname.startsWith(`${section.path}/`);
							}

							return (
								<Link
									key={section.id}
									href={section.path}
									className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
										isActive
											? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500"
											: "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
									}`}
								>
									<section.icon className={`mr-3 h-5 w-5 ${isActive ? "text-indigo-500" : "text-gray-400"}`} />
									{section.title}
								</Link>
							);
						})}
					</div>
				</div>
			</nav>
		</div>
	);
}
