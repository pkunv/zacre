import { Session } from "@/auth";
import { authMiddleware } from "@/lib/server/auth";
import { validateRequest } from "@/lib/server/validate-request";
import { NextFunction, Request, RequestHandler, Response } from "ultimate-express";
import { AnyZodObject } from "zod/v3";

export type RouterRequest = Request & {
	data: unknown;
	auth: Session | null;
	role?: string | string[];
};

// Type for a validated request handler
export type ValidatedHandler<T extends AnyZodObject> = (
	req: Request & { parsed: T["_output"]; auth: Session | null },
	res: Response,
	next: NextFunction,
) => Promise<void> | void;

// Type for route definition with schema and handler
export type RouteDefinition<T extends AnyZodObject> = {
	schema: T;
	handler: ValidatedHandler<T>;
	role?: string | string[];
};

// Type for router object with multiple routes
export type TypedRouter<T extends Record<string, RouteDefinition<AnyZodObject>>> = T;

// Helper function to create a route with schema and handler
export function createRoute<T extends AnyZodObject>({
	schema,
	handler,
	role,
}: {
	schema: T;
	handler: ValidatedHandler<T>;
	role?: string | string[];
}): RouteDefinition<T> {
	return { schema, handler, role };
}

export function passRoleMiddleware(role: string | string[] | undefined): RequestHandler {
	return (req: Request & { role?: string | string[] }, res: Response, next: NextFunction) => {
		req.role = role;
		next();
	};
}

// Helper function to create middleware array for a route
export function createMiddleware<T extends AnyZodObject>(
	route: RouteDefinition<T>,
): RequestHandler[] {
	return [
		validateRequest(route.schema),
		passRoleMiddleware(route.role),
		authMiddleware as unknown as RequestHandler,
		route.handler as unknown as RequestHandler,
	];
}

// Helper function to get schema and handler from route definition
export function getRouteComponents<T extends AnyZodObject>(route: RouteDefinition<T>) {
	return {
		schema: route.schema,
		handler: route.handler,
		role: route.role,
		middleware: createMiddleware(route),
	};
}
