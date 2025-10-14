import { executeLayoutModuleAction } from "@/lib/server/layout-modules/action";
import { getLayoutModulesData } from "@/lib/server/layout-modules/get";
import { renderLayoutModule } from "@/lib/server/layout-modules/render";
import { createRoute, RouterRequest } from "@/lib/server/typed-router";
import { tryCatch } from "@/lib/server/utils";
import { z } from "zod/v3";
export const layoutModulesRouter = {
	render: createRoute({
		schema: z.object({
			params: z.object({
				elementId: z.string(),
			}),
		}),
		handler: async (req, res) => {
			const { data, error } = await tryCatch(
				renderLayoutModule({
					elementId: req.data.params.elementId,
					req: req as unknown as RouterRequest,
				}),
			);

			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}

			// Convert VNode to HTML string before sending to client
			res.setHeader("Content-Type", "text/html");
			res.send(data);
			return;
		},
	}),
	get: createRoute({
		schema: z.object({
			query: z.object({
				elementIds: z.union([z.coerce.string(), z.array(z.coerce.string())]),
			}),
		}),
		handler: async (req, res) => {
			const elementIds: string[] = req.data.query.elementIds.includes(",")
				? // @ts-expect-error we don't need to type the request
					req.data.query.elementIds.split(",")
				: [req.data.query.elementIds];

			const { data, error } = await tryCatch(
				getLayoutModulesData({
					elementIds,
					req: req as unknown as RouterRequest,
				}),
			);
			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}
			if (data === null) {
				res.status(404).json({ status: "error", message: "Layout modules data not found" });
				return;
			}

			res.json({ status: "success", items: data });
		},
	}),
	action: createRoute({
		schema: z.object({
			params: z.object({
				elementId: z.string(),
			}),
		}),
		// Schema is validated in the function
		//schema: serverModules.map((m) => m.actionSchema).filter((m) => m !== undefined).reduce((acc, m) => acc.concat(m), z.object({})),
		handler: async (req, res) => {
			const { data, error } = await tryCatch(
				executeLayoutModuleAction({
					elementId: req.data.params.elementId,
					data: req.body,
					req: req as unknown as RouterRequest,
				}),
			);

			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}

			if (data && data.status !== undefined && data.status === "redirect") {
				res
					.status(302)
					.json({ status: "redirect", message: data.message, url: data.url, item: data });

				return;
			}

			res.json({ status: "success", item: data });
			return;
		},
	}),
};
