"use client";

import { useState } from "react";
import { Product } from "./ProductCard";
import AddToCartButton from "./AddToCartButton";

interface SizeSelectorProps {
	product: Product;
}

const SHOE_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45];

export default function SizeSelector({ product }: SizeSelectorProps) {
	const [selectedSize, setSelectedSize] = useState<number | null>(null);

	return (
		<div>
			<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6'>
				{SHOE_SIZES.map((size) => (
					<button
						key={size}
						className={`py-2 px-4 border rounded transition-colors ${
							selectedSize === size ? "bg-black text-white border-black" : "border-gray-300 hover:bg-gray-100"
						}`}
						onClick={() => setSelectedSize(size)}
					>
						{size}
					</button>
				))}
			</div>

			<div className='w-full'>
				<AddToCartButton product={product} fullWidth size='lg' selectedSize={selectedSize} />
			</div>
		</div>
	);
}
