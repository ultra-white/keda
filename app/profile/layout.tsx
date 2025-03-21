import { Metadata, Viewport } from "next";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "Кеда - Профиль",
	description: "Управление личными данными и заказами в вашем профиле магазина Кеда",
	keywords: ["профиль", "личный кабинет", "Кеда", "аккаунт", "управление заказами"],
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
