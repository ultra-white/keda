import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "Кеда - Корзина",
	description: "Просмотр и управление товарами в вашей корзине магазина Кеда",
	keywords: ["корзина", "Кеда", "обувь", "покупка", "оформление заказа"],
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
