export default function WhyChooseUs() {
	return (
		<section className='mt-12 bg-gray-100 p-8 rounded-lg mb-12'>
			<div className='max-w-3xl mx-auto text-center'>
				<h2 className='text-2xl font-bold mb-4'>Почему Кеда?</h2>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
					<div className='text-center'>
						<div className='flex justify-center mb-4'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='h-10 w-10 text-gray-700'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
							</svg>
						</div>
						<h3 className='font-bold mb-2'>Гарантия качества</h3>
						<p className='text-gray-600'>Мы предлагаем только оригинальную продукцию от известных брендов</p>
					</div>
					<div className='text-center'>
						<div className='flex justify-center mb-4'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='h-10 w-10 text-gray-700'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
						<h3 className='font-bold mb-2'>Быстрая доставка</h3>
						<p className='text-gray-600'>Доставка по всей России в течение 1-3 рабочих дней</p>
					</div>
					<div className='text-center'>
						<div className='flex justify-center mb-4'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								className='h-10 w-10 text-gray-700'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
								/>
							</svg>
						</div>
						<h3 className='font-bold mb-2'>Удобная оплата</h3>
						<p className='text-gray-600'>Различные способы оплаты для вашего удобства</p>
					</div>
				</div>
			</div>
		</section>
	);
}
