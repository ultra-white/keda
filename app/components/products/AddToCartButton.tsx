"use client";

import { ShoppingCart, ArrowRight, Minus, Plus } from "lucide-react";
import Button from "@/app/components/shared/Button";
import { Product } from "@/app/components/products/ProductCard";
import { useCart } from "@/app/contexts/CartContext";
import { useState, useEffect } from "react";
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
	const { addItem, items, updateQuantity, removeItem } = useCart();
	const [isAdding, setIsAdding] = useState(false);
	const [isAdded, setIsAdded] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	// Проверяем, есть ли товар с выбранным размером в корзине
	const cartItem = selectedSize
		? items.find((item) => item.product.id === product.id && item.product.selectedSize === selectedSize)
		: null;

	const quantity = cartItem?.quantity || 0;

	// Сбрасываем состояние, когда меняется выбранный размер или наличие товара в корзине
	useEffect(() => {
		// Если товар удален из корзины, сбрасываем isAdded
		if (!cartItem) {
			setIsAdded(false);
		}
	}, [selectedSize, cartItem]);

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
		}, 500);
	};

	// Увеличение количества
	const increaseQuantity = () => {
		if (!selectedSize || isUpdating) return;

		setIsUpdating(true);
		try {
			updateQuantity(product.id, quantity + 1, selectedSize);
		} finally {
			setIsUpdating(false);
		}
	};

	// Уменьшение количества
	const decreaseQuantity = () => {
		if (!selectedSize || isUpdating) return;

		// Сбрасываем флаг добавления товара, чтобы убрать сообщение при удалении
		if (isAdded) setIsAdded(false);

		setIsUpdating(true);
		try {
			if (quantity <= 1) {
				// Удаляем товар без отображения сообщения о добавлении
				removeItem(product.id, selectedSize);
				// Сразу сбрасываем состояние isAdded, чтобы не показывать сообщение
				setIsAdded(false);
			} else {
				updateQuantity(product.id, quantity - 1, selectedSize);
			}
		} finally {
			setIsUpdating(false);
		}
	};

	// Если товар уже в корзине, показываем кнопки +/-
	if (cartItem && selectedSize) {
		return (
			<div className='flex flex-col gap-2 w-full'>
				<div className='flex items-center justify-between border border-gray-300 rounded-md'>
					<button
						onClick={decreaseQuantity}
						className={`py-3 px-3 sm:px-5 text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:outline-none rounded-l-md flex-1 touch-manipulation ${
							isUpdating ? "opacity-50 cursor-not-allowed" : ""
						}`}
						disabled={isUpdating}
						aria-label='Уменьшить количество'
					>
						<Minus className='mx-auto' size={18} />
					</button>
					<span className='px-2 sm:px-4 py-2 font-medium text-base sm:text-lg min-w-[36px] text-center'>
						{quantity}
					</span>
					<button
						onClick={increaseQuantity}
						className={`py-3 px-3 sm:px-5 text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:outline-none rounded-r-md flex-1 touch-manipulation ${
							isUpdating ? "opacity-50 cursor-not-allowed" : ""
						}`}
						disabled={isUpdating}
						aria-label='Увеличить количество'
					>
						<Plus className='mx-auto' size={18} />
					</button>
				</div>
				<Link href='/cart' className='w-full'>
					<Button
						type='button'
						variant='outline'
						fullWidth={fullWidth}
						size={size}
						className='flex items-center justify-center w-full text-sm sm:text-base'
					>
						В корзину <ArrowRight className='h-4 w-4 ml-2' />
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
			className='flex items-center justify-center w-full'
		>
			<ShoppingCart className='h-5 w-5 mr-2 flex-shrink-0' />
			<span className='text-sm sm:text-base'>{selectedSize ? "Добавить в корзину" : "Выберите размер"}</span>
		</Button>
	);
}
