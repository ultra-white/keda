"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import AdminNavigation from "@/app/components/admin/AdminNavigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
	const { isAdmin, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && !isAdmin) {
			router.push("/auth/signin");
		}
	}, [isAdmin, isLoading, router]);

	if (isLoading) {
		return <div className='min-h-screen bg-gray-50 flex items-center justify-center'>Загрузка...</div>;
	}

	if (!isAdmin) {
		return null; // Редирект происходит в useEffect
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			{/* Основной контент */}
			<main className='container mx-auto px-[25px] lg:px-[50px] py-6'>
				<AdminNavigation />

				<div className='py-5'>{children}</div>
			</main>
		</div>
	);
}
