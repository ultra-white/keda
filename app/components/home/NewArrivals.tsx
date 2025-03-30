import Link from "next/link";
import ProductList from "../products/ProductList";
import { Product } from "../products/ProductCard";

interface NewArrivalsProps {
	products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
	return (
		<section className='mt-12'>
			<div className='flex justify-between items-center mb-6'>
				<h2 className='text-2xl font-bold'>Новые поступления</h2>
				<Link href='/products' className='text-black hover:underline flex items-center'>
					Посмотреть все
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='h-4 w-4 ml-1'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
					</svg>
				</Link>
			</div>

			<ProductList products={products} />
		</section>
	);
}
