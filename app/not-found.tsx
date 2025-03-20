"use client";

import Link from "next/link";
import { Footprints } from "lucide-react";
import Button from "./components/shared/Button";

export default function NotFound() {
	return (
		<div className='min-h-[calc(100vh-75px)] flex items-center justify-center px-4'>
			<div className='text-center'>
				<div className='flex justify-center mb-8'>
					<Footprints className='w-32 h-32 text-black/20 rotate-45' />
				</div>
				<h1 className='text-6xl font-bold mb-4'>404</h1>
				<h2 className='text-2xl font-medium mb-6'>Кажется, вы потерялись...</h2>
				<p className='text-gray-600 mb-8 max-w-md mx-auto'>
					Похоже, что страница, которую вы ищете, ушла гулять в другой обуви. Давайте вернемся на главную и найдем
					что-нибудь подходящее для вас!
				</p>
				<Link href='/'>
					<Button>Вернуться на главную</Button>
				</Link>
			</div>
		</div>
	);
}
