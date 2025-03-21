"use client";

import { ShoppingCart, CheckCircle, ArrowRight } from "lucide-react";
import Button from "@/app/components/shared/Button";
import { Product } from "@/app/components/products/ProductCard";
import { useCart } from "@/app/contexts/CartContext";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface AddToCartButtonProps {
	product: Product;
	fullWidth?: boolean;
	size?: "sm" | "md" | "lg";
	selectedSize?: number | null;
}

export default function AddToCartButton({
	product,
	fullWidth = true,
	size = "lg",
	selectedSize = null,
}: AddToCartButtonProps) {
	const { addItem, removeItem } = useCart();
	const [isAdding, setIsAdding] = useState(false);
	const [isAdded, setIsAdded] = useState(false);

	const handleAddToCart = () => {
		if (selectedSize === null) {
			toast.error("Пожалуйста, выберите размер обуви");
			return;
		}

		setIsAdding(true);

		// Добавляем товар в корзину с указанием размера
		addItem({ ...product, selectedSize });

		// Анимация добавления и показ подтверждения
		setTimeout(() => {
			setIsAdding(false);
			setIsAdded(true);

			// Сбрасываем состояние кнопки через 5 секунд
			setTimeout(() => {
				setIsAdded(false);
			}, 5000);
		}, 500);
	};

	if (isAdded) {
		return (
			<div className='space-y-2'>
				<div className='flex items-center justify-center text-green-600 mb-1'>
					<CheckCircle className='h-5 w-5 mr-2' />
					<span className='font-medium'>Товар добавлен</span>
				</div>
				<Link href='/cart'>
					<Button type='button' variant='outline' fullWidth={fullWidth} size={size}>
						Перейти в корзину <ArrowRight className='h-4 w-4 ml-2' />
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<Button
			type='button'
			onClick={handleAddToCart}
			fullWidth={fullWidth}
			size={size}
			isLoading={isAdding}
			disabled={selectedSize === null}
		>
			<ShoppingCart className='h-5 w-5 mr-2' />
			{selectedSize ? `Добавить в корзину (размер: ${selectedSize})` : "Выберите размер"}
		</Button>
	);
}
