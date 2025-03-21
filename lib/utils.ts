import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatRu(price: number): string {
	return new Intl.NumberFormat("ru-RU").format(price);
}

// Функция для форматирования цены в рублях
export const formatPrice = (price: number) => {
	return new Intl.NumberFormat("ru-RU", {
		style: "currency",
		currency: "RUB",
		minimumFractionDigits: 0,
	}).format(price);
};

// Форматирование даты для отображения в российском формате
export const formatRuDate = (date: string | Date) => {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("ru-RU", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

// Функция для преобразования параметров фильтрации из URL в объект
export function parseQueryParams(params: URLSearchParams) {
	const queryParams: Record<string, string | string[]> = {};

	params.forEach((value, key) => {
		if (key.endsWith("[]")) {
			const cleanKey = key.replace("[]", "");
			if (!queryParams[cleanKey]) {
				queryParams[cleanKey] = [];
			}
			(queryParams[cleanKey] as string[]).push(value);
		} else {
			queryParams[key] = value;
		}
	});

	return queryParams;
}

// Функция для преобразования объекта параметров в строку запроса URL
export function buildQueryString(params: Record<string, string | string[] | undefined>) {
	const urlParams = new URLSearchParams();

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined) {
			if (Array.isArray(value)) {
				value.forEach((v) => {
					urlParams.append(`${key}[]`, v);
				});
			} else {
				urlParams.append(key, value);
			}
		}
	});

	return urlParams.toString();
}

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 * @param a первая строка
 * @param b вторая строка
 * @returns расстояние Левенштейна (количество операций для превращения одной строки в другую)
 */
export function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];

	// Инициализация матрицы
	for (let i = 0; i <= a.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= b.length; j++) {
		matrix[0][j] = j;
	}

	// Заполнение матрицы
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1, // удаление
				matrix[i][j - 1] + 1, // вставка
				matrix[i - 1][j - 1] + cost // замена
			);
		}
	}

	return matrix[a.length][b.length];
}

/**
 * Вычисляет процент сходства двух строк
 * @param a первая строка
 * @param b вторая строка
 * @returns процент сходства от 0 до 100
 */
export function stringSimilarity(a: string, b: string): number {
	if (a.length === 0 || b.length === 0) return 0;

	const distance = levenshteinDistance(a, b);
	const maxLength = Math.max(a.length, b.length);

	// Вычисляем сходство в процентах
	return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Проверяет, соответствует ли строка поисковому запросу с учетом нечеткого поиска
 * @param text строка, в которой ищем
 * @param query поисковый запрос
 * @param threshold порог сходства в процентах (по умолчанию 90%)
 * @returns true, если строка соответствует запросу с учетом порога
 */
export function fuzzyMatch(text: string, query: string, threshold: number = 90): boolean {
	// Если строка содержит запрос - это 100% совпадение
	if (text.toLowerCase().includes(query.toLowerCase())) {
		return true;
	}

	// Разбиваем текст и запрос на слова
	const textWords = text.toLowerCase().split(/\s+/);
	const queryWords = query.toLowerCase().split(/\s+/);

	// Для каждого слова в запросе проверяем, соответствует ли оно какому-либо слову в тексте
	for (const queryWord of queryWords) {
		// Если слово короткое (менее 3 букв), требуем точного совпадения
		if (queryWord.length < 3) {
			if (textWords.includes(queryWord)) continue;
			return false;
		}

		let bestMatch = 0;

		// Ищем лучшее соответствие среди слов текста
		for (const textWord of textWords) {
			const similarity = stringSimilarity(textWord, queryWord);
			bestMatch = Math.max(bestMatch, similarity);

			// Если нашли достаточно хорошее совпадение, прерываем цикл
			if (bestMatch >= threshold) break;
		}

		// Если для текущего слова не нашли хорошего соответствия, запрос не соответствует тексту
		if (bestMatch < threshold) {
			return false;
		}
	}

	return true;
}
