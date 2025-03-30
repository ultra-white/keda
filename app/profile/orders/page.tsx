import OrdersList from "@/app/components/profile/OrdersList";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OrdersPage() {
	return (
		<div className='container mx-auto px-[25px] lg:px-[50px] py-12'>
			<div className='flex items-center justify-between mb-6 sm:flex-row flex-col gap-4'>
				<h1 className='text-3xl font-bold'>Мои заказы</h1>
				<Link href='/profile' className='inline-flex items-center text-black mb-0 hover:text-gray-700 hover:underline'>
					<ArrowLeft className='h-4 w-4 mr-2' />
					Вернуться в профиль
				</Link>
			</div>

			<div className='bg-white p-6 rounded-lg shadow-md'>
				<OrdersList />
			</div>
		</div>
	);
}
