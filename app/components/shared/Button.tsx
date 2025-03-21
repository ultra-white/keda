import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: "primary" | "outline" | "ghost" | "danger";
	size?: "sm" | "md" | "lg" | "base";
	fullWidth?: boolean;
	isLoading?: boolean;
}

export default function Button({
	children,
	variant = "primary",
	size = "base",
	fullWidth = false,
	isLoading = false,
	className,
	disabled,
	...props
}: ButtonProps) {
	const baseStyles =
		"inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

	const variants = {
		primary: "bg-black text-white hover:bg-zinc-800 focus-visible:ring-black",
		outline: "border border-black border-2 bg-white hover:bg-gray-100 focus-visible:ring-black",
		ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-black",
		danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
	};

	const sizes = {
		base: "h-9 w-auto px-3 text-base",
		sm: "h-8 px-3 text-sm",
		md: "h-10 px-4 text-base",
		lg: "h-12 px-6 text-lg",
	};

	return (
		<button
			className={cn(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? (
				<span className='mr-2'>
					<svg className='animate-spin h-4 w-4' viewBox='0 0 24 24'>
						<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none' />
						<path
							className='opacity-75'
							fill='currentColor'
							d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
						/>
					</svg>
				</span>
			) : null}
			{children}
		</button>
	);
}
