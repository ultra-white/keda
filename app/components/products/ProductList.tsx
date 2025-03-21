"use client";

import ProductCard, { Product } from "./ProductCard";

interface ProductListProps {
	products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
	if (!products.length) {
		return (
			<div className='text-center py-10'>
				<p className='text-gray-500'>Товары не найдены</p>
			</div>
		);
	}

	return (
		<div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'>
			{products.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	);
}
