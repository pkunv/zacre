import { auth, Session } from "@/auth";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "ultimate-express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function authMiddleware(
	req: Request & { auth: Session | null },
	res: Response,
	next: NextFunction,
	role?: string | string[],
) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});
	if (role !== undefined && session === null) {
		res.status(401).json({
			status: "error",
			message: "Unauthorized",
		});
		return;
	}
	if (role !== undefined && session?.user.role !== role) {
		res.status(401).json({
			status: "error",
			message: "Unauthorized",
		});
		return;
	}
	req.auth = session;
	next();
}
