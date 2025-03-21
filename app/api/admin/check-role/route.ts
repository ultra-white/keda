import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.email) {
			return NextResponse.json({ isAdmin: false }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			select: { role: true },
		});

		return NextResponse.json({
			isAdmin: user?.role === "ADMIN",
		});
	} catch (error) {
		console.error("Error checking admin role:", error);
		return NextResponse.json({ isAdmin: false }, { status: 500 });
	}
}
