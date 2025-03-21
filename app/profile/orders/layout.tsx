import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export const metadata: Metadata = {
	title: "Мои заказы | KEDA Shop",
	description: "История заказов пользователя",
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
