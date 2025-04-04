"use client";

import Link from "next/link";
import Image from "next/image";
import { Youtube } from "lucide-react";

export default function Footer() {
	return (
		<footer className='bg-black text-white py-20'>
			<div className='container mx-auto px-[25px] lg:px-[50px]'>
				<div className='flex justify-between flex-col md:flex-row gap-12'>
					{/* Логотип */}
					<div className='md:block flex justify-center'>
						<Link href='/' className='text-2xl font-bold'>
							<Image
								src='/logo-white.svg'
								alt='logo'
								width={100}
								height={40}
								style={{ width: "auto", height: "auto" }}
							/>
						</Link>
					</div>
					<div className='grid grid-cols-2 lg:grid-cols-4 gap-12 items-start justify-between'>
						<div>
							<h3 className='font-medium mb-4'>Категории</h3>
							<ul className='space-y-3 opacity-80'>
								<li>
									<Link href='/products?category=men' className='hover:text-gray-300'>
										Мужские
									</Link>
								</li>
								<li>
									<Link href='/products?category=women' className='hover:text-gray-300'>
										Женские
									</Link>
								</li>
								<li>
									<Link href='/products?category=children' className='hover:text-gray-300'>
										Детские
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h3 className='font-medium mb-4'>Контакты</h3>
							<ul className='space-y-3 opacity-80'>
								<li>
									<a href='tel:+79999999999' className='hover:text-gray-300'>
										+7 (999) 999 99-99
									</a>
								</li>
								<li>
									<a href='mailto:info@keda.ru' className='hover:text-gray-300'>
										info@keda.ru
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h3 className='font-medium mb-4'>Соц. сети</h3>
							<div className='flex space-x-4 opacity-80'>
								<Link href='#' className='hover:text-gray-300'>
									<Youtube className='w-5 h-5' />
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Копирайт */}
				<div className='mt-16 pt-8 border-t border-white/15'>
					<p className='text-center text-sm opacity-75'>© 2025 Keda | Все права защищены</p>
				</div>
			</div>
		</footer>
	);
}
