"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

interface Brand {
	id: number;
	name: string;
	logo: string;
}

interface BrandsListProps {
	brands: Brand[];
}

export default function BrandsList({ brands }: BrandsListProps) {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	return (
		<div className='flex flex-wrap justify-center gap-8 md:gap-12'>
			{brands.map((brand, index) => (
				<motion.div
					key={brand.id}
					className='relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center'
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: index * 0.1 }}
					onHoverStart={() => setHoveredIndex(index)}
					onHoverEnd={() => setHoveredIndex(null)}
				>
					<Link
						href={`/search?brand=${encodeURIComponent(brand.name)}`}
						className='block w-full h-full flex items-center justify-center p-4'
					>
						<motion.div
							initial={{ scale: 1 }}
							animate={{ scale: hoveredIndex === index ? 1.1 : 1 }}
							transition={{ type: "spring", stiffness: 300 }}
							className='w-full h-full relative'
						>
							<img
								src={brand.logo}
								alt={brand.name}
								className='w-full h-full object-contain filter grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100'
							/>
						</motion.div>
					</Link>
					{hoveredIndex === index && (
						<motion.div
							className='absolute bottom-0 left-0 right-0 bg-black text-white text-center text-xs py-1 rounded-b-md'
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
						>
							{brand.name}
						</motion.div>
					)}
				</motion.div>
			))}
		</div>
	);
}
