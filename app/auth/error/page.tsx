"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ErrorPage() {
	const searchParams = useSearchParams();
	const [error, setError] = useState<string>("");

	useEffect(() => {
		const error = searchParams.get("error");
		setError(error || "Произошла неизвестная ошибка");
	}, [searchParams]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-50'>
			<div className='max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md'>
				<div>
					<h2 className='text-center text-3xl font-bold text-gray-900'>Ошибка</h2>
				</div>

				<div className='bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative'>{error}</div>

				<div className='text-center'>
					<Link href='/auth/signin' className='text-black hover:text-gray-700 text-sm font-medium'>
						Вернуться на страницу входа
					</Link>
				</div>
			</div>
		</div>
	);
}
