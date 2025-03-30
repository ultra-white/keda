import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import Button from "@/app/components/shared/Button";

const EmptyCart = () => {
	return (
		<section className='container mx-auto px-[25px] lg:px-[50px] py-12'>
			<div className='max-w-3xl mx-auto text-center'>
				<div className='mb-8'>
					<ShoppingCart size={80} className='mx-auto text-gray-300' />
				</div>
				<h1 className='text-3xl font-bold mb-4'>Ваша корзина пуста</h1>
				<p className='text-gray-600 mb-8'>
					Похоже, вы еще не добавили товары в корзину. Перейдите в каталог, чтобы найти что-нибудь интересное!
				</p>
				<Link href='/products'>
					<Button size='lg'>Перейти к товарам</Button>
				</Link>
			</div>
		</section>
	);
};

export default EmptyCart;
