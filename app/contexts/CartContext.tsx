"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

// Типы и интерфейсы
export interface Product {
	id: string;
	name: string;
	description?: string;
	price: number;
	oldPrice?: number;
	selectedSize?: number | null;
	image?: string;
	brand?: { name: string };
	brandName?: string;
	model?: string;
	category?: { name: string };
}

interface CartItem {
	product: Product;
	quantity: number;
}

interface CartContextType {
	items: CartItem[];
	addItem: (product: Product) => Promise<void>;
	removeItem: (productId: string, selectedSize?: number | null) => Promise<void>;
	updateQuantity: (productId: string, quantity: number, selectedSize?: number | null) => Promise<void>;
	clearCart: () => Promise<void>;
	itemCount: number;
	totalPrice: number;
	totalPriceWithoutDiscount: number;
	totalDiscount: number;
	isLoading: boolean;
	// Новый метод для пакетного обновления
	batchUpdateQuantities: (
		updates: Array<{ productId: string; quantity: number; selectedSize?: number | null }>
	) => Promise<void>;
	// Флаг для отслеживания синхронизации без перерисовки компонентов
	isSyncing: boolean;
}

// Вспомогательные функции
const getItemKey = (product: Product): string => {
	return `${product.id}_${product.selectedSize || "default"}`;
};

const isLocalStorageAvailable = (): boolean => {
	try {
		const testKey = "__test__";
		localStorage.setItem(testKey, testKey);
		localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
};

// Создание контекста
const CartContext = createContext<CartContextType | undefined>(undefined);

// Функция для нормализации числовых значений
const normalizeNumber = (value: number | string | null | undefined, defaultValue: number = 0): number => {
	if (value === null || value === undefined) return defaultValue;
	return Number.isInteger(value) ? Number(value) : Math.round(Number(value));
};

// Добавляем хук useRef для отслеживания синхронизации
// Провайдер корзины
export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isCartLoaded, setIsCartLoaded] = useState(false);
	// Используем useRef для отслеживания идущей синхронизации без ререндера
	const isSyncing = React.useRef(false);
	const pendingSyncTimeout = React.useRef<NodeJS.Timeout | null>(null);
	const lastSyncItems = React.useRef<CartItem[]>([]);

	const { status } = useSession();
	const isAuthenticated = status === "authenticated";
	const hasLocalStorage = isLocalStorageAvailable();

	// API взаимодействие
	const api = useMemo(() => {
		return {
			async getCart() {
				const response = await fetch("/api/cart/");
				if (!response.ok) {
					throw new Error(`Ошибка получения корзины: ${response.status}`);
				}
				return response.json();
			},

			async syncCart(cartItems: CartItem[]) {
				// Подготовка данных для отправки
				const preparedItems = cartItems
					.filter((item) => item.product && item.product.id && item.quantity > 0)
					.map((item) => ({
						quantity: item.quantity,
						product: {
							id: item.product.id,
							price: normalizeNumber(item.product.price),
							oldPrice: item.product.oldPrice ? normalizeNumber(item.product.oldPrice) : null,
							selectedSize: item.product.selectedSize ? normalizeNumber(item.product.selectedSize) : 40,
							name: item.product.name,
							brandName: item.product.brandName || "",
							model: item.product.model || "",
							description: item.product.description || "",
							image: item.product.image || "",
						},
					}));

				const response = await fetch("/api/cart/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ items: preparedItems }),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: "Неизвестная ошибка" }));
					throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
				}

				return true;
			},

			async addToCart(productId: string, quantity: number, selectedSize?: number | null) {
				const response = await fetch("/api/cart/add/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productId, quantity, selectedSize }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Ошибка при добавлении товара");
				}
			},

			async removeFromCart(productId: string, selectedSize?: number | null) {
				const response = await fetch("/api/cart/remove/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productId, selectedSize }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Ошибка при удалении товара");
				}
			},

			async updateCartItem(productId: string, quantity: number, selectedSize?: number | null) {
				const response = await fetch("/api/cart/update/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productId, quantity, selectedSize }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Ошибка при обновлении товара");
				}
			},

			async clearCart() {
				const response = await fetch("/api/cart/clear/", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Ошибка при очистке корзины");
				}
			},
		};
	}, []);

	// Локальное хранилище
	const storage = useMemo(() => {
		return {
			saveCart(cartItems: CartItem[]) {
				if (!hasLocalStorage) return;
				try {
					localStorage.setItem("cart", JSON.stringify(cartItems));
				} catch (error) {
					console.error("Ошибка сохранения корзины:", error);
				}
			},

			loadCart(): CartItem[] {
				if (!hasLocalStorage) return [];

				try {
					const savedCart = localStorage.getItem("cart");
					return savedCart ? JSON.parse(savedCart) : [];
				} catch (error) {
					console.error("Ошибка загрузки корзины:", error);
					localStorage.removeItem("cart");
					return [];
				}
			},

			clearCart() {
				if (!hasLocalStorage) return;
				try {
					localStorage.removeItem("cart");
				} catch (error) {
					console.error("Ошибка очистки корзины:", error);
				}
			},
		};
	}, [hasLocalStorage]);

	// Объединение корзин
	const mergeCartItems = useCallback((dbItems: CartItem[], localItems: CartItem[]): CartItem[] => {
		const mergedMap = new Map<string, CartItem>();

		// Добавляем элементы из БД
		dbItems.forEach((item) => {
			const key = getItemKey(item.product);
			mergedMap.set(key, item);
		});

		// Добавляем или обновляем элементы из локального хранилища
		localItems.forEach((item) => {
			const key = getItemKey(item.product);
			if (mergedMap.has(key)) {
				const existingItem = mergedMap.get(key)!;
				mergedMap.set(key, {
					...existingItem,
					quantity: existingItem.quantity + item.quantity,
				});
			} else {
				mergedMap.set(key, item);
			}
		});

		return Array.from(mergedMap.values());
	}, []);

	// Загрузка корзины
	useEffect(() => {
		const loadCart = async () => {
			if (isCartLoaded) return;
			setIsLoading(true);

			try {
				if (isAuthenticated) {
					// Загрузка из БД
					try {
						const { items: dbItems } = await api.getCart();
						setItems(dbItems || []);

						// Объединение с локальной корзиной
						const localItems = storage.loadCart();
						if (localItems.length > 0) {
							const mergedItems = mergeCartItems(dbItems || [], localItems);
							setItems(mergedItems);

							// Синхронизация и очистка локального хранилища
							// Не используем await здесь, чтобы не задерживать UI
							api
								.syncCart(mergedItems)
								.then(() => storage.clearCart())
								.catch((syncError) => {
									console.error("Ошибка синхронизации корзины:", syncError);
								});
						}
					} catch (dbError) {
						console.error("Ошибка загрузки из БД:", dbError);
						const localItems = storage.loadCart();
						setItems(localItems);
					}
				} else {
					// Загрузка из локального хранилища
					const localItems = storage.loadCart();
					setItems(localItems);
				}
			} catch (error) {
				console.error("Ошибка при загрузке корзины:", error);
				toast.error("Не удалось загрузить корзину");
			} finally {
				setIsCartLoaded(true);
				setIsLoading(false);
			}
		};

		// Отложенный запуск загрузки
		const initialLoadTimeout = setTimeout(loadCart, 100);
		return () => clearTimeout(initialLoadTimeout);
	}, [isAuthenticated, isCartLoaded, api, storage, mergeCartItems]);

	// Сброс флага загрузки при изменении статуса авторизации
	useEffect(() => {
		if (status !== "loading" && (status === "authenticated" || status === "unauthenticated")) {
			setIsCartLoaded(false);
		}
	}, [status]);

	// Функция для отложенной синхронизации с сервером
	const debouncedSyncCart = useCallback(
		(cartItems: CartItem[]) => {
			// Отменяем предыдущий таймаут, если он существует
			if (pendingSyncTimeout.current) {
				clearTimeout(pendingSyncTimeout.current);
			}

			// Сохраняем последнее состояние элементов для синхронизации
			lastSyncItems.current = cartItems;

			// Увеличиваем задержку для снижения частоты обновлений
			pendingSyncTimeout.current = setTimeout(() => {
				const itemsToSync = lastSyncItems.current;

				if (itemsToSync.length > 0) {
					if (isAuthenticated && !isSyncing.current) {
						isSyncing.current = true;
						api
							.syncCart(itemsToSync)
							.catch((error) => {
								console.error("Ошибка синхронизации корзины:", error);
								// Уведомляем только о серьезных ошибках
								if (error.message.includes("401") || error.message.includes("403")) {
									toast.error("Ошибка синхронизации корзины: требуется авторизация");
								}
							})
							.finally(() => {
								isSyncing.current = false;
							});
					} else if (!isAuthenticated) {
						storage.saveCart(itemsToSync);
					}
				} else if (itemsToSync.length === 0 && !window.location.href.includes("/cart/clear")) {
					if (isAuthenticated) {
						api.clearCart().catch(console.error);
					}
					storage.clearCart();
				}
			}, 800);
		},
		[isAuthenticated, api, storage]
	);

	// Синхронизация корзины при изменении
	useEffect(() => {
		if (!isCartLoaded) return;

		debouncedSyncCart(items);

		return () => {
			if (pendingSyncTimeout.current) {
				clearTimeout(pendingSyncTimeout.current);
			}
		};
	}, [items, isCartLoaded, debouncedSyncCart]);

	// Методы управления корзиной
	const removeItem = useCallback(
		async (productId: string, selectedSize?: number | null) => {
			const previousItems = [...items];

			try {
				// Обновляем состояние
				setItems((prevItems) => {
					if (selectedSize !== undefined) {
						return prevItems.filter(
							(item) => !(item.product.id === productId && item.product.selectedSize === selectedSize)
						);
					} else {
						return prevItems.filter((item) => item.product.id !== productId);
					}
				});

				// Синхронизируем с сервером
				if (isAuthenticated) {
					await api.removeFromCart(productId, selectedSize);
				}
			} catch (error) {
				console.error("Ошибка удаления товара:", error);
				toast.error("Не удалось удалить товар из корзины");
				setItems(previousItems);
			}
		},
		[items, isAuthenticated, api]
	);

	const addItem = useCallback(
		async (product: Product) => {
			// Только для первого добавления товара в пустую корзину показываем индикатор загрузки
			const shouldShowLoading = items.length === 0;
			if (shouldShowLoading) {
				setIsLoading(true);
			}

			try {
				// Сначала обновляем локальное состояние
				setItems((prevItems) => {
					const itemKey = getItemKey(product);
					const existingItemIndex = prevItems.findIndex((item) => getItemKey(item.product) === itemKey);

					if (existingItemIndex >= 0) {
						const newItems = [...prevItems];
						newItems[existingItemIndex] = {
							...newItems[existingItemIndex],
							quantity: newItems[existingItemIndex].quantity + 1,
						};
						return newItems;
					} else {
						return [...prevItems, { product, quantity: 1 }];
					}
				});

				// Показываем уведомление об успехе
				toast.success("Товар добавлен в корзину");

				// Не ждем завершения запроса к API, синхронизация произойдет через useEffect
			} catch (error) {
				console.error("Ошибка добавления товара:", error);
				if (isAuthenticated) {
					toast.error("Товар добавлен только локально");
				}
			} finally {
				if (shouldShowLoading) {
					setIsLoading(false);
				}
			}
		},
		[items, isAuthenticated]
	);

	const updateQuantity = useCallback(
		async (productId: string, quantity: number, selectedSize?: number | null) => {
			// Проверяем необходимость обновления
			const existingItem = items.find(
				(item) =>
					item.product.id === productId &&
					(selectedSize !== undefined ? item.product.selectedSize === selectedSize : true)
			);

			// Если товар не найден или количество не изменилось
			if (!existingItem || existingItem.quantity === quantity) {
				return;
			}

			// Сохраняем предыдущее состояние
			const previousItems = [...items];

			try {
				// Если количество <= 0, удаляем товар
				if (quantity <= 0) {
					await removeItem(productId, selectedSize);
					return;
				}

				// Обновляем локальное состояние без установки isLoading
				setItems((prevItems) => {
					if (selectedSize !== undefined) {
						return prevItems.map((item) =>
							item.product.id === productId && item.product.selectedSize === selectedSize ? { ...item, quantity } : item
						);
					} else {
						return prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
					}
				});

				// Оптимизируем: не ждем завершения API-запроса для обновления UI,
				// Синхронизация произойдет автоматически через useEffect
			} catch (error) {
				console.error("Ошибка обновления количества:", error);
				toast.error("Не удалось обновить количество товара");
				setItems(previousItems);
			}
		},
		[items, removeItem]
	);

	const clearCart = useCallback(async () => {
		const previousItems = [...items];
		setIsLoading(true);

		try {
			setItems([]);

			// Очищаем также память о последней синхронизации
			lastSyncItems.current = [];

			// Оптимистичная очистка без ожидания ответа от сервера
			if (isAuthenticated) {
				api.clearCart().catch((error) => {
					console.error("Ошибка очистки корзины:", error);
					toast.error("Не удалось очистить корзину на сервере");
				});
			}
			storage.clearCart();
		} catch (error) {
			console.error("Ошибка очистки корзины:", error);
			toast.error("Не удалось очистить корзину");
			setItems(previousItems);
		} finally {
			setIsLoading(false);
		}
	}, [items, isAuthenticated, api, storage]);

	// Добавляем новый метод для пакетного обновления количеств
	const batchUpdateQuantities = useCallback(
		async (updates: Array<{ productId: string; quantity: number; selectedSize?: number | null }>) => {
			// Используем единую транзакцию для всех обновлений
			const previousItems = [...items];

			try {
				// Применяем все обновления в одной операции состояния
				setItems((prevItems) => {
					// Создаем копию для работы
					const updatedItems = [...prevItems];

					// Применяем каждое обновление
					updates.forEach(({ productId, quantity, selectedSize }) => {
						// Пропускаем недействительные обновления
						if (quantity < 0) return;

						if (quantity === 0) {
							// Удаляем элемент если количество = 0
							const index = updatedItems.findIndex(
								(item) =>
									item.product.id === productId &&
									(selectedSize !== undefined ? item.product.selectedSize === selectedSize : true)
							);
							if (index !== -1) updatedItems.splice(index, 1);
						} else {
							// Обновляем количество
							const index = updatedItems.findIndex(
								(item) =>
									item.product.id === productId &&
									(selectedSize !== undefined ? item.product.selectedSize === selectedSize : true)
							);

							if (index !== -1) {
								updatedItems[index] = { ...updatedItems[index], quantity };
							}
						}
					});

					return updatedItems;
				});

				// Не ждем завершения синхронизации - это произойдет через useEffect
			} catch (error) {
				console.error("Ошибка пакетного обновления корзины:", error);
				toast.error("Не удалось обновить корзину");
				setItems(previousItems);
			}
		},
		[items]
	);

	// Вычисляемые значения
	const derivedValues = useMemo(() => {
		// Общее количество товаров
		const itemCount = items.reduce((count, item) => count + item.quantity, 0);

		// Общая стоимость с учетом скидок
		const totalPrice = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

		// Стоимость без скидок
		const totalPriceWithoutDiscount = items.reduce(
			(total, item) => total + (item.product.oldPrice || item.product.price) * item.quantity,
			0
		);

		// Сумма скидки
		const totalDiscount = totalPriceWithoutDiscount - totalPrice;

		return {
			itemCount,
			totalPrice,
			totalPriceWithoutDiscount,
			totalDiscount,
		};
	}, [items]);

	// Значение контекста
	const value = useMemo(
		() => ({
			items,
			addItem,
			removeItem,
			updateQuantity,
			clearCart,
			...derivedValues,
			isLoading,
			batchUpdateQuantities,
			isSyncing: isSyncing.current,
		}),
		[
			items,
			addItem,
			removeItem,
			updateQuantity,
			clearCart,
			derivedValues,
			isLoading,
			batchUpdateQuantities,
			isSyncing.current,
		]
	);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Хук для использования корзины
export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart должен использоваться внутри CartProvider");
	}
	return context;
}

// Хук для работы с отдельным товаром в корзине
// Оптимизированный хук для работы с отдельным товаром без перерендеринга всего списка
export function useCartItem(productId: string, selectedSize?: number | null) {
	const { items, updateQuantity, removeItem } = useCart();

	// Находим текущий товар
	const item = useMemo(() => {
		return items.find(
			(item) =>
				item.product.id === productId &&
				(selectedSize !== undefined ? item.product.selectedSize === selectedSize : true)
		);
	}, [items, productId, selectedSize]);

	// Методы для работы с товаром
	const increment = useCallback(() => {
		if (item) {
			updateQuantity(productId, item.quantity + 1, selectedSize);
		}
	}, [item, updateQuantity, productId, selectedSize]);

	const decrement = useCallback(() => {
		if (item && item.quantity > 1) {
			updateQuantity(productId, item.quantity - 1, selectedSize);
		} else if (item) {
			removeItem(productId, selectedSize);
		}
	}, [item, updateQuantity, removeItem, productId, selectedSize]);

	const setQuantity = useCallback(
		(newQuantity: number) => {
			updateQuantity(productId, newQuantity, selectedSize);
		},
		[updateQuantity, productId, selectedSize]
	);

	const remove = useCallback(() => {
		removeItem(productId, selectedSize);
	}, [removeItem, productId, selectedSize]);

	return {
		item,
		quantity: item?.quantity || 0,
		exists: !!item,
		increment,
		decrement,
		setQuantity,
		remove,
	};
}
