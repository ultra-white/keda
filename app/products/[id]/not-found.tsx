import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
	return (
		<div className='container mx-auto px-[25px] lg:px-[50px] py-16 text-center'>
			<h1 className='text-4xl font-bold mb-4'>Товар не найден</h1>
			<p className='text-gray-600 text-lg mb-8'>К сожалению, запрашиваемый товар не найден или был удален.</p>
			<Link
				href='/products'
				className='inline-flex items-center text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-md font-medium transition'
			>
				<ArrowLeft className='h-5 w-5 mr-2' />
				Вернуться к каталогу
			</Link>
		</div>
	);
}
