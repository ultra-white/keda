"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, User, ArrowRight, Search, Menu, X } from "lucide-react";
import Button from "./shared/Button";
import Input from "./shared/input";
import { useState } from "react";

export default function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<>
			<header className='h-[75px] fixed top-0 left-0 w-full bg-white z-50'>
				<div className='container mx-auto h-full px-[25px] lg:px-[50px]'>
					<nav className='flex items-center justify-between w-full h-full'>
						<div className='flex items-center xl:space-x-15 md:space-x-8'>
							<Link href='/' className='text-2xl font-bold'>
								<Image src='/logo.svg' alt='logo' width={100} height={100} />
							</Link>

							<div className='items-center space-x-6 text-md lg:flex hidden'>
								<Link href='/men' className='hover:text-gray-600'>
									Мужские
								</Link>
								<Link href='/women' className='hover:text-gray-600'>
									Женские
								</Link>
								<Link href='/kids' className='hover:text-gray-600'>
									Детские
								</Link>
							</div>
						</div>

						<div className='flex-1 md:flex items-center space-x-2.5 h-9 mx-6 max-w-2/4 hidden'>
							<Input type='text' placeholder='Поиск товаров...' icon={<Search className='w-5 h-5' />} />
							<Button>
								<Search className='w-6 h-6' />
							</Button>
						</div>

						<div className='flex items-center space-x-4 lg:hidden'>
							<button onClick={() => setIsMenuOpen(!isMenuOpen)} className='p-2 transition-transform duration-300'>
								{isMenuOpen ? (
									<X className='w-9 h-9 transform transition-transform duration-300 rotate-180' />
								) : (
									<Menu className='w-9 h-9' />
								)}
							</button>
						</div>

						<div className='hidden lg:flex items-center space-x-4'>
							<Link href='/profile'>
								<Button variant='outline'>
									<User className='w-6 h-6' />
								</Button>
							</Link>
							<Link href='/cart'>
								<Button className='relative group'>
									<div className='flex items-center gap-2'>
										<span className='select-none pointer-events-none text-lg'>3</span>
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
				className={`lg:hidden fixed top-[75px] left-0 right-0 bg-white shadow-lg z-40 transition-all duration-300 ease-in-out transform ${
					isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
				} border-t border-gray-100`}
				style={{
					boxShadow: isMenuOpen ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" : "none",
				}}
			>
				<div className='container mx-auto'>
					<div className='flex flex-col py-4 px-[25px] lg:px-[50px] space-y-4'>
						<div className='items-center space-x-2.5 h-9 mb-4 flex md:hidden'>
							<Input type='text' placeholder='Поиск товаров...' icon={<Search className='w-5 h-5' />} />
							<Button>
								<Search className='w-6 h-6' />
							</Button>
						</div>
						<Link href='/profile' className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md'>
							<User className='w-6 h-6' />
							<span>Профиль</span>
						</Link>
						<Link href='/cart' className='flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md'>
							<div className='relative w-6 h-6'>
								<ShoppingCart className='w-6 h-6' />
								<span className='absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
									3
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
