"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/app/components/products/ProductCard";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

type CartItem = {
	product: Product;
	quantity: number;
};

// Функция для генерации уникального ключа товара, учитывая его размер
const getItemKey = (product: Product): string => {
	return `${product.id}_${product.selectedSize || "default"}`;
};

interface CartContextType {
	items: CartItem[];
	addItem: (product: Product) => void;
	removeItem: (productId: string, selectedSize?: number | null) => void;
	updateQuantity: (productId: string, quantity: number, selectedSize?: number | null) => void;
	clearCart: () => void;
	itemCount: number;
	totalPrice: number;
	totalPriceWithoutDiscount: number;
	totalDiscount: number;
	isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Функция для безопасной проверки доступности localStorage
const isLocalStorageAvailable = () => {
	try {
		const testKey = "__test__";
		localStorage.setItem(testKey, testKey);
		localStorage.removeItem(testKey);
		return true;
	} catch (e) {
		return false;
	}
};

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isCartLoaded, setIsCartLoaded] = useState(false); // Флаг для отслеживания загрузки корзины
	const { data: session, status } = useSession();
	const isAuthenticated = status === "authenticated";
	const hasLocalStorage = isLocalStorageAvailable();

	// Загрузка корзины
	useEffect(() => {
		const loadCart = async () => {
			if (isCartLoaded) return; // Предотвращаем повторную загрузку если корзина уже загружена
			setIsLoading(true);

			try {
				if (isAuthenticated) {
					// Если пользователь авторизован, сначала загружаем из БД
					const response = await fetch("/api/cart");
					if (response.ok) {
						const { items: dbItems } = await response.json();
						setItems(dbItems || []);

						// Если в локальном хранилище есть элементы, объединяем их с данными из БД
						if (hasLocalStorage) {
							const savedCart = localStorage.getItem("cart");
							if (savedCart) {
								try {
									const localItems: CartItem[] = JSON.parse(savedCart);
									if (localItems.length > 0) {
										// Объединяем корзины и отправляем на сервер
										const mergedItems = mergeCartItems(dbItems || [], localItems);
										setItems(mergedItems);

										// Сохраняем объединенную корзину в БД
										await syncCartWithDb(mergedItems);

										// Очищаем локальное хранилище после синхронизации
										localStorage.removeItem("cart");
									}
								} catch (error) {
									console.error("Ошибка при загрузке корзины из localStorage:", error);
									if (hasLocalStorage) localStorage.removeItem("cart");
								}
							}
						}
					} else {
						// Если не удалось загрузить из БД, проверяем локальное хранилище
						loadFromLocalStorage();
					}
				} else {
					// Если пользователь не авторизован, загружаем из локального хранилища
					loadFromLocalStorage();
				}
				setIsCartLoaded(true); // Помечаем корзину как загруженную
			} catch (error) {
				console.error("Ошибка при загрузке корзины:", error);
				loadFromLocalStorage(); // Если ошибка, используем локальное хранилище
				setIsCartLoaded(true); // Помечаем корзину как загруженную даже в случае ошибки
			} finally {
				setIsLoading(false);
			}
		};

		// Функция для загрузки из localStorage
		const loadFromLocalStorage = () => {
			if (!hasLocalStorage) return;

			const savedCart = localStorage.getItem("cart");
			if (savedCart) {
				try {
					const parsedCart = JSON.parse(savedCart);
					setItems(parsedCart);
					console.log("Корзина загружена из localStorage:", parsedCart);
				} catch (error) {
					console.error("Ошибка при загрузке корзины из localStorage:", error);
					localStorage.removeItem("cart");
				}
			}
		};

		// Функция для объединения корзин
		const mergeCartItems = (dbItems: CartItem[], localItems: CartItem[]): CartItem[] => {
			const mergedMap = new Map<string, CartItem>();

			// Сначала добавляем все элементы из БД
			dbItems.forEach((item) => {
				const key = getItemKey(item.product);
				mergedMap.set(key, item);
			});

			// Затем добавляем или обновляем элементы из локального хранилища
			localItems.forEach((item) => {
				const key = getItemKey(item.product);
				if (mergedMap.has(key)) {
					// Если товар уже есть, увеличиваем количество
					const existingItem = mergedMap.get(key)!;
					mergedMap.set(key, {
						...existingItem,
						quantity: existingItem.quantity + item.quantity,
					});
				} else {
					// Если товара нет, добавляем его
					mergedMap.set(key, item);
				}
			});

			return Array.from(mergedMap.values());
		};

		// Отложенный запуск загрузки корзины, чтобы дать браузеру инициализировать localStorage
		setTimeout(() => {
			loadCart();
		}, 100);
	}, [isAuthenticated, isCartLoaded, hasLocalStorage]); // Добавляем hasLocalStorage в зависимости

	// Сбрасываем флаг загрузки корзины при изменении статуса авторизации
	useEffect(() => {
		if (status !== "loading") {
			// Не сбрасываем флаг загрузки корзины при каждом изменении статуса,
			// а только если авторизация успешна или неуспешна (но не в процессе)
			if (status === "authenticated" || status === "unauthenticated") {
				if (!isCartLoaded) {
					setIsCartLoaded(false);
				}
			}
		}
	}, [status, isCartLoaded]);

	// Синхронизация с базой данных при изменении корзины
	useEffect(() => {
		if (!isCartLoaded) return; // Не сохраняем, пока не завершена первоначальная загрузка

		// Предотвращаем очистку корзины при первой загрузке или обновлении страницы
		const handleCart = () => {
			if (items.length > 0) {
				if (isAuthenticated) {
					// Если пользователь авторизован, сохраняем в БД
					syncCartWithDb(items);
				} else if (hasLocalStorage) {
					// Иначе сохраняем в localStorage если он доступен
					try {
						const itemsJson = JSON.stringify(items);
						localStorage.setItem("cart", itemsJson);
						console.log("Корзина сохранена в localStorage:", items);
					} catch (error) {
						console.error("Ошибка при сохранении корзины в localStorage:", error);
					}
				}
			} else if (items.length === 0 && !window.location.href.includes("/cart/clear")) {
				// Очищаем хранилище только если корзина действительно пуста и это не результат обновления страницы
				console.log("Корзина пуста, очищаем хранилище");
				if (isAuthenticated) {
					clearDbCart();
				}
				if (hasLocalStorage) {
					try {
						localStorage.removeItem("cart");
					} catch (error) {
						console.error("Ошибка при очистке корзины в localStorage:", error);
					}
				}
			}
		};

		// Отложенная обработка, чтобы избежать очистки корзины при обновлении страницы
		const timeoutId = setTimeout(handleCart, 300);

		return () => clearTimeout(timeoutId);
	}, [items, isAuthenticated, isCartLoaded, hasLocalStorage]);

	// Функция для синхронизации корзины с БД
	const syncCartWithDb = async (cartItems: CartItem[]) => {
		if (!isAuthenticated) return;

		try {
			await fetch("/api/cart", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ items: cartItems }),
			});
		} catch (error) {
			console.error("Ошибка при синхронизации корзины с БД:", error);
		}
	};

	// Функция для очистки корзины в БД
	const clearDbCart = async () => {
		if (!isAuthenticated) return;

		try {
			await fetch("/api/cart/clear", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
		} catch (error) {
			console.error("Ошибка при очистке корзины в БД:", error);
		}
	};

	// Добавление товара в корзину
	const addItem = async (product: Product) => {
		setIsLoading(true);

		try {
			if (isAuthenticated) {
				// Если пользователь авторизован, добавляем через API
				const response = await fetch("/api/cart/add", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productId: product.id,
						quantity: 1,
						selectedSize: product.selectedSize,
					}),
				});

				if (response.ok) {
					// Обновляем состояние на клиенте
					setItems((prevItems) => {
						const itemKey = getItemKey(product);
						const existingItemIndex = prevItems.findIndex((item) => getItemKey(item.product) === itemKey);

						if (existingItemIndex >= 0) {
							// Увеличиваем количество, если товар уже в корзине
							const newItems = [...prevItems];
							newItems[existingItemIndex] = {
								...newItems[existingItemIndex],
								quantity: newItems[existingItemIndex].quantity + 1,
							};
							return newItems;
						} else {
							// Добавляем новый товар
							return [...prevItems, { product, quantity: 1 }];
						}
					});

					toast.success("Товар добавлен в корзину");
				} else {
					const errorData = await response.json();
					console.error("Ошибка API:", errorData);
					throw new Error(errorData.error || "Ошибка при добавлении товара");
				}
			} else {
				// Если не авторизован, обновляем только локальное состояние
				setItems((prevItems) => {
					const itemKey = getItemKey(product);
					const existingItemIndex = prevItems.findIndex((item) => getItemKey(item.product) === itemKey);

					if (existingItemIndex >= 0) {
						// Увеличиваем количество, если товар уже в корзине
						const newItems = [...prevItems];
						newItems[existingItemIndex] = {
							...newItems[existingItemIndex],
							quantity: newItems[existingItemIndex].quantity + 1,
						};
						return newItems;
					} else {
						// Добавляем новый товар
						return [...prevItems, { product, quantity: 1 }];
					}
				});

				toast.success("Товар добавлен в корзину");
			}
		} catch (error) {
			console.error("Ошибка при добавлении товара в корзину:", error);
			// Добавляем товар локально даже если запрос к API не удался
			if (isAuthenticated) {
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
				toast.success("Товар добавлен в корзину (локально)");
			} else {
				toast.error("Не удалось добавить товар в корзину");
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Удаление товара из корзины
	const removeItem = async (productId: string, selectedSize?: number | null) => {
		setIsLoading(true);

		try {
			if (isAuthenticated) {
				// Если пользователь авторизован, удаляем через API
				const response = await fetch("/api/cart/remove", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productId,
						selectedSize,
					}),
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Ошибка при удалении товара");
				}
			}

			// В любом случае обновляем локальное состояние
			setItems((prevItems) => {
				if (selectedSize !== undefined) {
					// Удаляем конкретный размер товара
					return prevItems.filter(
						(item) => !(item.product.id === productId && item.product.selectedSize === selectedSize)
					);
				} else {
					// Удаляем все размеры этого товара
					return prevItems.filter((item) => item.product.id !== productId);
				}
			});
		} catch (error) {
			console.error("Ошибка при удалении товара из корзины:", error);
			toast.error("Не удалось удалить товар из корзины");
		} finally {
			setIsLoading(false);
		}
	};

	// Обновление количества товара
	const updateQuantity = async (productId: string, quantity: number, selectedSize?: number | null) => {
		setIsLoading(true);

		try {
			if (quantity <= 0) {
				await removeItem(productId, selectedSize);
				return;
			}

			if (isAuthenticated) {
				// Если пользователь авторизован, обновляем через API
				const response = await fetch("/api/cart/update", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productId,
						quantity,
						selectedSize,
					}),
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Ошибка при обновлении товара");
				}
			}

			// В любом случае обновляем локальное состояние
			setItems((prevItems) => {
				if (selectedSize !== undefined) {
					// Обновляем конкретный размер товара
					return prevItems.map((item) =>
						item.product.id === productId && item.product.selectedSize === selectedSize ? { ...item, quantity } : item
					);
				} else {
					// Обновляем все размеры этого товара
					return prevItems.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
				}
			});
		} catch (error) {
			console.error("Ошибка при обновлении количества товара:", error);
			toast.error("Не удалось обновить количество товара");
		} finally {
			setIsLoading(false);
		}
	};

	// Очистка корзины
	const clearCart = async () => {
		setIsLoading(true);

		try {
			if (isAuthenticated) {
				// Если пользователь авторизован, очищаем через API
				const response = await fetch("/api/cart/clear", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Ошибка при очистке корзины");
				}
			}

			// В любом случае очищаем локальное состояние
			setItems([]);
		} catch (error) {
			console.error("Ошибка при очистке корзины:", error);
			toast.error("Не удалось очистить корзину");
		} finally {
			setIsLoading(false);
		}
	};

	// Подсчет общего количества товаров
	const itemCount = items.reduce((count, item) => count + item.quantity, 0);

	// Подсчет общей стоимости с учетом скидок
	const totalPrice = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

	// Расчет суммы без учета скидок (для отображения экономии)
	const totalPriceWithoutDiscount = items.reduce(
		(total, item) => total + (item.product.oldPrice || item.product.price) * item.quantity,
		0
	);

	// Сумма скидки
	const totalDiscount = totalPriceWithoutDiscount - totalPrice;

	const value = {
		items,
		addItem,
		removeItem,
		updateQuantity,
		clearCart,
		itemCount,
		totalPrice,
		totalPriceWithoutDiscount,
		totalDiscount,
		isLoading,
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
}
