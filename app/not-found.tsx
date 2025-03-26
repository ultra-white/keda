import Link from "next/link";
import { Footprints } from "lucide-react";
import { Suspense } from "react";

// Простой компонент кнопки вместо использования Button из компонентов
function SimpleButton({ children }: { children: React.ReactNode }) {
	return (
		<button className='bg-black text-white hover:bg-zinc-800 h-10 px-4 text-base inline-flex items-center justify-center rounded-md font-medium transition-colors'>
			{children}
		</button>
	);
}

export default function NotFound() {
	return (
		<Suspense fallback={<div>Загрузка...</div>}>
			<div className='min-h-[calc(100vh-75px)] flex items-center justify-center px-4'>
				<div className='text-center'>
					<div className='flex justify-center mb-8'>
						<Footprints className='w-32 h-32 text-black/20 rotate-45' />
					</div>
					<h1 className='text-6xl font-bold mb-4'>404</h1>
					<h2 className='text-2xl font-medium mb-6'>Кажется, вы потерялись...</h2>
					<p className='text-gray-600 mb-8 max-w-md mx-auto'>
						Похоже, что страница, которую вы ищете, ушла гулять в другой обуви. Давайте вернемся на главную и найдем
						что-нибудь подходящее для вас!
					</p>
					<Link href='/'>
						<SimpleButton>Вернуться на главную</SimpleButton>
					</Link>
				</div>
			</div>
		</Suspense>
	);
}
