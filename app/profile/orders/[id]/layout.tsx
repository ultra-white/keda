import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export const metadata: Metadata = {
	title: "Детали заказа | KEDA Shop",
	description: "Подробная информация о заказе",
};

export default function OrderDetailsLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
