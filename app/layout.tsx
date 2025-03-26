import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Providers } from "./providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "Кеда - Магазин обуви",
	description: "Интернет-магазин обуви Кеда с широким ассортиментом по выгодным ценам",
	keywords: "обувь, кроссовки, ботинки, туфли, кеды, интернет-магазин",
	authors: [{ name: "Команда Кеда" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='ru'>
			<body className={inter.className}>
				<Providers>
					<Suspense fallback={<div className='h-[75px]'></div>}>
						<Header />
					</Suspense>
					<main className='min-h-screen pt-[75px]'>{children}</main>
					<Footer />
				</Providers>
			</body>
		</html>
	);
}
