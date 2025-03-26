"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, ArrowRight, Search, Menu, X, Package } from "lucide-react";
import Button from "./shared/Button";
import Input from "./shared/Input";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/app/contexts/CartContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Интерфейс для категории
interface Category {
	id: string;
	name: string;
	slug: string;
}

export default function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [categories, setCategories] = useState<Category[]>([]);
	const { data: session } = useSession();
	const { itemCount } = useCart();
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Получаем список категорий при загрузке компонента
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch("/api/categories");
				if (response.ok) {
					const data = await response.json();
					setCategories(data);
				}
			} catch (error) {
				console.error("Ошибка загрузки категорий:", error);
			}
		};

		fetchCategories();
	}, []);

	// При загрузке компонента берем параметр search из URL если он есть
	useEffect(() => {
		const searchParam = searchParams.get("search");
		if (searchParam) {
			setSearchTerm(searchParam);
		}
	}, [searchParams]);

	// Функция для закрытия меню
	const closeMenu = () => {
		setIsMenuOpen(false);
	};

	// Обработчик поиска
	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();

		if (!searchTerm.trim()) return;

		// Создаем новые параметры URL
		const params = new URLSearchParams();

		// Добавляем текущие параметры из URL
		if (pathname === "/products") {
			for (const [key, value] of Array.from(searchParams.entries())) {
				if (key !== "search" && key !== "threshold") {
					params.set(key, value);
				}
			}
		}

		// Добавляем поисковый запрос
		params.set("search", searchTerm.trim());

		// Добавляем параметр порога схожести для нечеткого поиска (90%)
		params.set("threshold", "90");

		// Перенаправляем на страницу продуктов с параметром поиска
		router.push(`/products?${params.toString()}`);

		// Закрываем мобильное меню если оно было открыто
		closeMenu();
	};

	// Обработчик перехода к категории - больше не нужен, будем использовать напрямую в href
	const getCategoryUrl = (categorySlug: string) => {
		const params = new URLSearchParams();
		params.set("category", categorySlug);
		return `/products?${params.toString()}`;
	};

	// Обработчик клика вне меню
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				isMenuOpen &&
				menuRef.current &&
				buttonRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				closeMenu();
			}
		};

		// Обработчик нажатия Escape для закрытия меню
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (isMenuOpen && event.key === "Escape") {
				closeMenu();
			}
		};

		// Добавляем обработчики событий
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscapeKey);

		// Очистка обработчиков
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscapeKey);
		};
	}, [isMenuOpen]);

	// Обработчик клика по ссылкам в меню
	const handleLinkClick = () => {
		closeMenu();
	};

	// Получаем основные категории для меню (предполагаем, что они есть в загруженных категориях)
	const menCategory = categories.find(
		(cat) => cat.slug === "muzhskie" || cat.slug === "men" || cat.name.toLowerCase().includes("муж")
	);
	const womenCategory = categories.find(
		(cat) => cat.slug === "zhenskie" || cat.slug === "women" || cat.name.toLowerCase().includes("жен")
	);
	const kidsCategory = categories.find(
		(cat) => cat.slug === "detskie" || cat.slug === "kids" || cat.name.toLowerCase().includes("дет")
	);

	return (
		<>
			<header className='h-[75px] fixed top-0 left-0 w-full bg-white z-50'>
				<div className='container mx-auto h-full px-[25px] lg:px-[50px]'>
					<nav className='flex items-center justify-between w-full h-full'>
						<div className='flex items-center xl:space-x-15 md:space-x-8'>
							<Link href='/' className='text-2xl font-bold'>
								<Image
									src='/logo.svg'
									alt='logo'
									width={100}
									height={40}
									priority
									style={{ width: "auto", height: "auto" }}
								/>
							</Link>

							<div className='items-center space-x-6 text-md lg:flex hidden'>
								{menCategory && (
									<Link href={getCategoryUrl(menCategory.slug)} className='hover:text-gray-600'>
										Мужские
									</Link>
								)}
								{womenCategory && (
									<Link href={getCategoryUrl(womenCategory.slug)} className='hover:text-gray-600'>
										Женские
									</Link>
								)}
								{kidsCategory && (
									<Link href={getCategoryUrl(kidsCategory.slug)} className='hover:text-gray-600'>
										Детские
									</Link>
								)}
							</div>
						</div>

						<form onSubmit={handleSearch} className='flex-1 md:flex items-center space-x-2.5 h-9 mx-6 max-w-2/4 hidden'>
							<Input
								type='text'
								placeholder='Поиск товаров...'
								icon={<Search className='w-5 h-5' />}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<Button type='submit'>
								<Search className='w-6 h-6' />
							</Button>
						</form>

						<div className='flex items-center space-x-4 lg:hidden'>
							<button
								ref={buttonRef}
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className='p-2 transition-transform duration-300'
								aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
							>
								{isMenuOpen ? (
									<X className='w-9 h-9 transform transition-transform duration-300 rotate-180' />
								) : (
									<Menu className='w-9 h-9' />
								)}
							</button>
						</div>

						<div className='hidden lg:flex items-center space-x-4'>
							{session ? (
								<Link href='/profile'>
									<Button variant='outline'>
										<User className='w-6 h-6' />
									</Button>
								</Link>
							) : (
								<Link href='/auth/signin'>
									<Button variant='outline'>
										<User className='w-6 h-6' />
									</Button>
								</Link>
							)}
							<Link href='/cart'>
								<Button className='relative group'>
									<div className='flex items-center gap-2'>
										<span className='select-none pointer-events-none text-lg'>{itemCount || 0}</span>
										<div className='h-4 w-[1px] bg-gray-300 mx-1'></div>
										<div className='relative w-6 h-6 overflow-hidden'>
											<ShoppingCart className='h-6 w-6 absolute group-hover:translate-x-[200%] transition-transform duration-300' />
											<ArrowRight className='h-6 w-6 absolute -translate-x-[200%] group-hover:translate-x-0 transition-transform duration-300' />
										</div>
									</div>
								</Button>
							</Link>
						</div>
					</nav>
				</div>
			</header>

			{/* Мобильное меню */}
			<div
				ref={menuRef}
				className={`lg:hidden fixed top-[75px] left-0 right-0 bg-white shadow-lg z-40 transition-all duration-300 ease-in-out transform ${
					isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
				} border-t border-gray-100`}
				style={{
					boxShadow: isMenuOpen ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "none",
				}}
			>
				<div className='container mx-auto'>
					<div className='flex flex-col py-4 px-[25px] lg:px-[50px] space-y-4'>
						<form onSubmit={handleSearch} className='items-center space-x-2.5 h-9 mb-4 flex md:hidden'>
							<Input
								type='text'
								placeholder='Поиск товаров...'
								icon={<Search className='w-5 h-5' />}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							<Button type='submit'>
								<Search className='w-6 h-6' />
							</Button>
						</form>

						{/* Категории в мобильном меню */}
						<div className='border-t border-b border-gray-100 py-3 space-y-3'>
							{menCategory && (
								<Link
									href={getCategoryUrl(menCategory.slug)}
									className='flex w-full items-center p-2 hover:bg-gray-100 rounded-md'
									onClick={handleLinkClick}
								>
									Мужские
								</Link>
							)}
							{womenCategory && (
								<Link
									href={getCategoryUrl(womenCategory.slug)}
									className='flex w-full items-center p-2 hover:bg-gray-100 rounded-md'
									onClick={handleLinkClick}
								>
									Женские
								</Link>
							)}
							{kidsCategory && (
								<Link
									href={getCategoryUrl(kidsCategory.slug)}
									className='flex w-full items-center p-2 hover:bg-gray-100 rounded-md'
									onClick={handleLinkClick}
								>
									Детские
								</Link>
							)}
						</div>

						<Link
							href={session ? "/profile" : "/auth/signin"}
							className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md'
							onClick={handleLinkClick}
						>
							<User className='w-6 h-6' />
							<span>{session ? "Профиль" : "Войти"}</span>
						</Link>

						{session && (
							<Link
								href='/profile/orders'
								className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md'
								onClick={handleLinkClick}
							>
								<Package className='w-6 h-6' />
								<span>Мои заказы</span>
							</Link>
						)}

						<Link
							href='/cart'
							className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md'
							onClick={handleLinkClick}
						>
							<div className='relative w-6 h-6'>
								<ShoppingCart className='w-6 h-6' />
								<span className='absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
									{itemCount || 0}
								</span>
							</div>
							<span>Корзина</span>
						</Link>
					</div>
				</div>
			</div>
		</>
	);
}
