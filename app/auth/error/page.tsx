import Link from "next/link";

// Серверный компонент получает searchParams напрямую из Next.js
export default function ErrorPage({
	searchParams,
}: {
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	// Получаем параметр ошибки из пропсов на сервере
	const errorMessage = typeof searchParams.error === "string" ? searchParams.error : "Произошла неизвестная ошибка";

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50'>
			<div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md'>
				<div>
					<h2 className='text-center text-3xl font-bold text-gray-900'>Ошибка</h2>
				</div>

				<div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative'>{errorMessage}</div>

				<div className='text-center'>
					<Link href='/auth/signin' className='text-black hover:text-gray-700 text-sm font-medium'>
						Вернуться на страницу входа
					</Link>
				</div>
			</div>
		</div>
	);
}
