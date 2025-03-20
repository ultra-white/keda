import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	icon?: React.ReactNode;
}

export default function Input({ icon, className, ...props }: InputProps) {
	return (
		<div className='w-full relative flex items-center'>
			{icon && <div className='absolute left-3 text-gray-400'>{icon}</div>}
			<input
				className={`w-full h-9 flex items-center justify-center px-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${
					icon ? "pl-10" : ""
				} ${className || ""}`}
				{...props}
			/>
		</div>
	);
}
