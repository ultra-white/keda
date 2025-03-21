"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface PriceRangeFilterProps {
	minPossiblePrice?: number;
	maxPossiblePrice?: number;
}

export default function PriceRangeFilter({ minPossiblePrice = 0, maxPossiblePrice = 100000 }: PriceRangeFilterProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Получаем текущие параметры из URL
	const urlMinPrice = searchParams.get("minPrice");
	const urlMaxPrice = searchParams.get("maxPrice");
	const currentMinPrice = urlMinPrice ? Number(urlMinPrice) : minPossiblePrice;
	const currentMaxPrice = urlMaxPrice ? Number(urlMaxPrice) : maxPossiblePrice;

	// Состояние для значений в полях ввода и ползунков
	const [minPrice, setMinPrice] = useState<number>(currentMinPrice);
	const [maxPrice, setMaxPrice] = useState<number>(currentMaxPrice);

	// Добавляем состояние для текстовых полей
	const [minPriceText, setMinPriceText] = useState<string>(
		currentMinPrice > minPossiblePrice ? currentMinPrice.toString() : ""
	);
	const [maxPriceText, setMaxPriceText] = useState<string>(
		currentMaxPrice < maxPossiblePrice ? currentMaxPrice.toString() : ""
	);

	// Для дебаунс эффекта фильтрации
	const [debouncedMinPrice, setDebouncedMinPrice] = useState<number>(currentMinPrice);
	const [debouncedMaxPrice, setDebouncedMaxPrice] = useState<number>(currentMaxPrice);

	// Refs для ползунков
	const minThumbRef = useRef<HTMLDivElement>(null);
	const maxThumbRef = useRef<HTMLDivElement>(null);
	const sliderTrackRef = useRef<HTMLDivElement>(null);

	// Состояние для активного ползунка (min или max)
	const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);

	// Состояние для открытия/закрытия контента фильтра
	const [isOpen, setIsOpen] = useState(true);

	// Обновляем состояние при изменении URL (например, при сбросе фильтров)
	useEffect(() => {
		// Создаем переменную, указывающую, нужно ли обновлять состояние
		let shouldUpdate = false;

		// Проверяем изменения минимальной цены
		const newMinPrice = urlMinPrice ? Number(urlMinPrice) : minPossiblePrice;
		if (minPrice !== newMinPrice) {
			shouldUpdate = true;
		}

		// Проверяем изменения максимальной цены
		const newMaxPrice = urlMaxPrice ? Number(urlMaxPrice) : maxPossiblePrice;
		if (maxPrice !== newMaxPrice) {
			shouldUpdate = true;
		}

		// Если есть изменения, обновляем состояние
		if (shouldUpdate) {
			setMinPrice(newMinPrice);
			setMaxPrice(newMaxPrice);
			setDebouncedMinPrice(newMinPrice);
			setDebouncedMaxPrice(newMaxPrice);
		}
	}, [urlMinPrice, urlMaxPrice, minPossiblePrice, maxPossiblePrice]);

	// Функция для преобразования значения цены в позицию на слайдере (в процентах)
	const priceToPercent = useCallback(
		(price: number): number => {
			return ((price - minPossiblePrice) / (maxPossiblePrice - minPossiblePrice)) * 100;
		},
		[minPossiblePrice, maxPossiblePrice]
	);

	// Функция для преобразования позиции на слайдере в значение цены
	const percentToPrice = useCallback(
		(percent: number): number => {
			return Math.round(minPossiblePrice + (percent / 100) * (maxPossiblePrice - minPossiblePrice));
		},
		[minPossiblePrice, maxPossiblePrice]
	);

	// Обработчик начала перетаскивания ползунка
	const handleThumbMouseDown = (e: React.MouseEvent, thumb: "min" | "max") => {
		e.preventDefault();
		setActiveThumb(thumb);
	};

	// Обработчик перемещения мыши (для перетаскивания ползунка)
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!activeThumb || !sliderTrackRef.current) return;

			// Получаем положение и размеры трека слайдера
			const trackRect = sliderTrackRef.current.getBoundingClientRect();
			const trackWidth = trackRect.width;

			// Учитываем отступы по краям (left и right = 3px)
			const adjustedLeft = trackRect.left + 3;
			const adjustedWidth = trackWidth - 6;

			// Вычисляем положение курсора относительно трека слайдера (в процентах)
			let percent = Math.max(0, Math.min(100, ((e.clientX - adjustedLeft) / adjustedWidth) * 100));

			// Применяем значение с учетом выбранного ползунка
			if (activeThumb === "min") {
				// Минимальный ползунок не может быть правее максимального (с отступом для удобства)
				const maxPercent = priceToPercent(maxPrice) - 5;
				percent = Math.min(percent, maxPercent);
				setMinPrice(percentToPrice(percent));
			} else {
				// Максимальный ползунок не может быть левее минимального (с отступом для удобства)
				const minPercent = priceToPercent(minPrice) + 5;
				percent = Math.max(percent, minPercent);
				setMaxPrice(percentToPrice(percent));
			}
		};

		// Обработчик отпускания кнопки мыши
		const handleMouseUp = () => {
			setActiveThumb(null);
		};

		// Добавляем обработчики только если активен ползунок
		if (activeThumb) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [activeThumb, minPrice, maxPrice, percentToPrice, priceToPercent]);

	// Применение фильтра с дебаунсом
	const applyFilter = useCallback(() => {
		// Создаем новый экземпляр URLSearchParams с текущими параметрами
		const params = new URLSearchParams(searchParams.toString());

		// Устанавливаем или удаляем параметры цены
		if (debouncedMinPrice > minPossiblePrice) {
			params.set("minPrice", debouncedMinPrice.toString());
		} else {
			params.delete("minPrice");
		}

		if (debouncedMaxPrice < maxPossiblePrice) {
			params.set("maxPrice", debouncedMaxPrice.toString());
		} else {
			params.delete("maxPrice");
		}

		// Создаем новый URL и переходим на него
		router.push(`${pathname}?${params.toString()}`, { scroll: false });
	}, [debouncedMinPrice, debouncedMaxPrice, router, pathname, searchParams, minPossiblePrice, maxPossiblePrice]);

	// Применяем фильтр при изменении дебаунсированных значений
	useEffect(() => {
		applyFilter();
	}, [debouncedMinPrice, debouncedMaxPrice, applyFilter]);

	// Дебаунсирование изменений цен
	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);

		timerRef.current = setTimeout(() => {
			setDebouncedMinPrice(minPrice);
			setDebouncedMaxPrice(maxPrice);
		}, 500);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [minPrice, maxPrice]);

	// Таймер для дебаунса
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Обработчик изменения минимальной цены в текстовом поле
	const handleMinPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// Разрешаем пустую строку или числа
		if (value === "" || /^\d+$/.test(value)) {
			setMinPriceText(value);

			if (value === "") {
				setMinPrice(minPossiblePrice);
			} else {
				const numValue = Number(value);
				// При вводе обновляем минимальную цену только если она в допустимых пределах,
				// но разрешаем пользователю продолжать ввод в любом случае
				if (numValue >= minPossiblePrice && numValue <= maxPrice - 100) {
					setMinPrice(numValue);
				}
			}
		}
	};

	// Обработчик изменения максимальной цены в текстовом поле
	const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		// Разрешаем пустую строку или числа
		if (value === "" || /^\d+$/.test(value)) {
			setMaxPriceText(value);

			if (value === "") {
				setMaxPrice(maxPossiblePrice);
			} else {
				const numValue = Number(value);
				// При вводе обновляем максимальную цену только если она в допустимых пределах,
				// но разрешаем пользователю продолжать ввод в любом случае
				if (numValue <= maxPossiblePrice && numValue >= minPrice + 100) {
					setMaxPrice(numValue);
				}
			}
		}
	};

	// Обработчики для валидации значений при потере фокуса
	const handleMinPriceBlur = () => {
		let numValue = minPriceText === "" ? minPossiblePrice : Number(minPriceText);

		// Ограничиваем значение при потере фокуса
		numValue = Math.max(minPossiblePrice, Math.min(numValue, maxPrice - 100));

		// Обновляем оба состояния с валидным значением
		setMinPrice(numValue);
		setMinPriceText(numValue === minPossiblePrice ? "" : numValue.toString());
	};

	const handleMaxPriceBlur = () => {
		let numValue = maxPriceText === "" ? maxPossiblePrice : Number(maxPriceText);

		// Ограничиваем значение при потере фокуса
		numValue = Math.min(maxPossiblePrice, Math.max(numValue, minPrice + 100));

		// Обновляем оба состояния с валидным значением
		setMaxPrice(numValue);
		setMaxPriceText(numValue === maxPossiblePrice ? "" : numValue.toString());
	};

	// Обновляем текстовые поля при изменении minPrice/maxPrice через ползунки
	useEffect(() => {
		setMinPriceText(minPrice === minPossiblePrice ? "" : minPrice.toString());
	}, [minPrice, minPossiblePrice]);

	useEffect(() => {
		setMaxPriceText(maxPrice === maxPossiblePrice ? "" : maxPrice.toString());
	}, [maxPrice, maxPossiblePrice]);

	// Форматирование цены для лучшего представления
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("ru-RU").format(price);
	};

	// Состояние цен для отображения
	const priceRangeText =
		minPrice > minPossiblePrice || maxPrice < maxPossiblePrice
			? `${formatPrice(minPrice)} ₽ — ${formatPrice(maxPrice)} ₽`
			: "Цена";

	return (
		<div className='w-full mb-6'>
			<h3 className='font-medium mb-2 flex justify-between items-center'>
				<span>{priceRangeText}</span>
				<button
					className='text-gray-600 hover:text-black flex items-center text-sm cursor-pointer'
					onClick={() => setIsOpen(!isOpen)}
				>
					<span className='cursor-pointer'>{isOpen ? "Скрыть" : "Показать"}</span>
					<ChevronDown
						className={`ml-1 w-4 h-4 transition-transform ${isOpen ? "transform rotate-180" : ""} cursor-pointer`}
					/>
				</button>
			</h3>

			{/* Контент фильтра (сворачивается/разворачивается) */}
			<div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-60" : "max-h-0"}`}>
				{/* Ползунок с двумя бегунками */}
				<div className='my-4 relative h-8 px-3'>
					{/* Трек слайдера */}
					<div ref={sliderTrackRef} className='absolute h-2 top-3 left-3 right-3 rounded-full bg-gray-200'>
						{/* Активная часть слайдера */}
						<div
							className='absolute h-2 bg-gray-800 rounded-full'
							style={{
								left: `${priceToPercent(minPrice)}%`,
								right: `${100 - priceToPercent(maxPrice)}%`,
							}}
						></div>
					</div>

					{/* Бегунок для минимальной цены */}
					<div
						ref={minThumbRef}
						className={`absolute top-1.5 w-5 h-5 rounded-full bg-white border-2 ${
							activeThumb === "min" ? "border-black shadow-lg" : "border-gray-800 shadow-md"
						} z-20 cursor-pointer`}
						style={{ left: `calc(${priceToPercent(minPrice)}% * 0.90 + 3px)` }}
						onMouseDown={(e) => handleThumbMouseDown(e, "min")}
						onTouchStart={() => setActiveThumb("min")}
					></div>

					{/* Бегунок для максимальной цены */}
					<div
						ref={maxThumbRef}
						className={`absolute top-1.5 w-5 h-5 rounded-full bg-white border-2 ${
							activeThumb === "max" ? "border-black shadow-lg" : "border-gray-800 shadow-md"
						} z-20 cursor-pointer`}
						style={{
							left: `calc(min(${priceToPercent(maxPrice)}% * 0.90 + 3px, calc(100% - 8px)))`,
						}}
						onMouseDown={(e) => handleThumbMouseDown(e, "max")}
						onTouchStart={() => setActiveThumb("max")}
					></div>
				</div>

				{/* Поля ввода */}
				<div className='flex items-center gap-2 mt-4'>
					<input
						type='text'
						value={minPriceText}
						onChange={handleMinPriceInputChange}
						onBlur={handleMinPriceBlur}
						placeholder={`от ${minPossiblePrice}`}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:ring-inset'
					/>
					<span className='text-gray-500'>—</span>
					<input
						type='text'
						value={maxPriceText}
						onChange={handleMaxPriceInputChange}
						onBlur={handleMaxPriceBlur}
						placeholder={`до ${maxPossiblePrice}`}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:ring-inset'
					/>
				</div>
			</div>
		</div>
	);
}
