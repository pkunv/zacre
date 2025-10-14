import { NextFunction, Request, RequestHandler, Response } from "ultimate-express";
import { AnyZodObject } from "zod/v3";

export const validateRequest =
	<T extends AnyZodObject>(schema: T): RequestHandler =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			let data = await schema.parseAsync({
				body: req.body,
				query: req.query,
				params: req.params,
			});
			if (schema.shape.body === undefined) {
				data = await schema.parseAsync({
					query: req.query,
					params: req.params,
				});
			}

			// Set the parsed data on the request object
			(req as any).data = data;
			next();
		} catch (error) {
			console.error("Validation error:", error);
			res.status(400).json({
				status: "error",
				message: "Invalid request: " + JSON.stringify(error),
				...(process.env.NODE_ENV === "development" && {
					details: error instanceof Error ? error.message : "Unknown validation error",
				}),
			});
		}
	};
