type SortableItem = Record<string, any>;

/**
 * Сортировка элементов по заданному полю и направлению
 * @param items Массив элементов для сортировки
 * @param sortKey Ключ поля для сортировки (например, 'name', 'price')
 * @param sortDirection Направление сортировки ('asc' или 'desc')
 * @returns Отсортированный массив элементов
 */
export function sortItems<T extends SortableItem>(items: T[], sortKey: string, sortDirection: "asc" | "desc"): T[] {
	if (!sortKey || !items.length) return [...items];

	return [...items].sort((a, b) => {
		// Получаем значения для сравнения
		let valueA = getNestedValue(a, sortKey);
		let valueB = getNestedValue(b, sortKey);

		// Приводим к строчному регистру для текстовых значений
		if (typeof valueA === "string") valueA = valueA.toLowerCase();
		if (typeof valueB === "string") valueB = valueB.toLowerCase();

		// Числовое сравнение
		if (typeof valueA === "number" && typeof valueB === "number") {
			return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
		}

		// Сравнение дат (если значения являются строками даты)
		const dateA = new Date(valueA);
		const dateB = new Date(valueB);
		if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
			return sortDirection === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
		}

		// Строковое сравнение
		if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
		if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
		return 0;
	});
}

/**
 * Получение значений из вложенных объектов по пути разделенному точками
 * (например, 'category.name')
 */
function getNestedValue(obj: SortableItem, path: string): any {
	return path.split(".").reduce((value, key) => {
		return value && value[key] !== undefined ? value[key] : null;
	}, obj);
}

/**
 * Функция для генерации массива стандартных опций сортировки
 */
export function generateSortOptions(fields: { key: string; label: string }[]) {
	const options = [];

	for (const field of fields) {
		options.push({
			value: `${field.key}_asc`,
			label: `${field.label} ↑`,
		});

		options.push({
			value: `${field.key}_desc`,
			label: `${field.label} ↓`,
		});
	}

	return options;
}

/**
 * Функция для разбора строки сортировки (например 'price_desc')
 * @returns [sortKey, sortDirection]
 */
export function parseSortString(sortString: string): [string, "asc" | "desc"] {
	if (!sortString) return ["", "asc"];

	const parts = sortString.split("_");
	if (parts.length !== 2) return ["", "asc"];

	const sortKey = parts[0];
	const sortDirection = parts[1] === "desc" ? "desc" : "asc";

	return [sortKey, sortDirection];
}
