import { Metadata, Viewport } from "next";
import ClientLayout from "./ClientLayout";

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "Кеда - Панель управления",
	description: "Административная панель для управления магазином Кеда",
	keywords: ["админ", "панель управления", "Кеда", "администрирование"],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return <ClientLayout>{children}</ClientLayout>;
}
