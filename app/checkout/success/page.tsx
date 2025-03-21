"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Home, ArrowRight, ShoppingBag } from "lucide-react";
import Button from "@/app/components/shared/Button";

export default function CheckoutSuccessPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [orderId, setOrderId] = useState<string | null>(null);

	useEffect(() => {
		const id = searchParams.get("orderId");

		if (!id) {
			// Если нет id заказа, перенаправляем на главную
			router.push("/");
			return;
		}

		setOrderId(id);
	}, [searchParams, router]);

	if (!orderId) {
		return (
			<div className='container mx-auto px-[25px] lg:px-[50px] py-12 mt-16 flex justify-center items-center min-h-[60vh]'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
			</div>
		);
	}

	return (
		<div className='container mx-auto px-[25px] lg:px-[50px] py-12 mt-8'>
			<div className='max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-xl shadow-md border border-gray-100'>
				<div className='flex flex-col items-center justify-center mb-8'>
					<div className='bg-green-50 p-4 rounded-full mb-4'>
						<CheckCircle className='h-20 w-20 text-green-500' />
					</div>
					<h1 className='text-3xl font-bold text-center mb-2'>Заказ успешно оформлен!</h1>
					<div className='h-1 w-16 bg-green-500 rounded-full mb-4'></div>
					<p className='text-gray-600 text-center text-lg max-w-md'>
						Ваш заказ <span className='font-semibold text-black'>#{orderId.substring(0, 8)}</span> был успешно создан и
						принят в обработку.
					</p>
				</div>

				<div className='bg-gray-50 p-5 rounded-lg mb-8'>
					<h2 className='font-semibold mb-3 text-lg'>Что дальше?</h2>
					<ul className='space-y-3'>
						<li className='flex items-start'>
							<div className='mr-3 mt-1 bg-blue-100 rounded-full p-1'>
								<Package className='h-4 w-4 text-blue-600' />
							</div>
							<p className='text-gray-700'>Вы получите уведомление о статусе заказа на ваш email</p>
						</li>
						<li className='flex items-start'>
							<div className='mr-3 mt-1 bg-purple-100 rounded-full p-1'>
								<CheckCircle className='h-4 w-4 text-purple-600' />
							</div>
							<p className='text-gray-700'>Наш менеджер свяжется с вами для подтверждения деталей заказа</p>
						</li>
						<li className='flex items-start'>
							<div className='mr-3 mt-1 bg-amber-100 rounded-full p-1'>
								<Home className='h-4 w-4 text-amber-600' />
							</div>
							<p className='text-gray-700'>Вы можете отслеживать статус заказа в личном кабинете</p>
						</li>
					</ul>
				</div>

				<div className='grid gap-4 sm:grid-cols-2'>
					<Link href={`/profile/orders/${orderId}`}>
						<Button className='w-full flex items-center justify-center bg-black hover:bg-gray-800 transition-colors py-3'>
							<Package className='h-5 w-5 mr-2' />
							Детали заказа
						</Button>
					</Link>

					<Link href='/profile/orders'>
						<Button variant='outline' className='w-full flex items-center justify-center border-2 py-3'>
							Мои заказы
						</Button>
					</Link>

					<Link href='/products' className='sm:col-span-2'>
						<Button
							variant='outline'
							className='w-full flex items-center justify-center border bg-gray-50 hover:bg-gray-100 text-black py-3'
						>
							<ShoppingBag className='h-5 w-5 mr-2' />
							Продолжить покупки
						</Button>
					</Link>

					<Link href='/' className='sm:col-span-2'>
						<Button
							variant='ghost'
							className='w-full flex items-center justify-center text-gray-600 hover:text-black transition-colors'
						>
							<Home className='h-5 w-5 mr-2' />
							На главную
							<ArrowRight className='h-4 w-4 ml-2' />
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
