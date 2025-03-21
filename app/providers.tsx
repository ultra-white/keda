"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "./contexts/CartContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<CartProvider>
				{children}
				<Toaster
					position='top-right'
					containerStyle={{
						top: 80,
					}}
					toastOptions={{
						duration: 5000,
						style: {
							background: "#ffffff",
							color: "#333333",
							maxWidth: "500px",
							padding: "16px",
							boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
							borderRadius: "8px",
							border: "1px solid #e5e7eb",
						},
						success: {
							style: {
								background: "#ffffff",
								border: "1px solid #e5e7eb",
							},
							iconTheme: {
								primary: "#10B981",
								secondary: "#ffffff",
							},
						},
					}}
				/>
			</CartProvider>
		</SessionProvider>
	);
}
