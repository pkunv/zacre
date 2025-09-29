import { db } from "@/lib/server/db";
import { insertLayoutModuleMetadata, layoutModuleIncludes } from "@/lib/server/layout";
import { logMessage } from "@/lib/server/log";
import { getModuleParameters } from "@/lib/server/parameter";
import { createRoute } from "@/lib/server/typed-router";
import { ModuleActionError, serverModules } from "@/modules/server";
import { renderToString } from "preact-render-to-string";
import { z } from "zod/v3";

export const layoutModulesRouter = {
	render: createRoute({
		schema: z.object({
			params: z.object({
				elementId: z.string(),
			}),
		}),
		handler: async (req, res) => {
			const elementId = req.parsed.params.elementId;

			const layoutModule = await db.layoutModule.findUnique({
				where: {
					id: elementId,
				},
				include: layoutModuleIncludes,
			});
			if (!layoutModule) {
				res.status(404).json({ status: "error", message: "Layout module not found" });
				return;
			}
			const serverModule = serverModules.find((m) => m.shortName === layoutModule.module.shortName);

			if (!serverModule || !serverModule.render) {
				res.status(404).json({ status: "error", message: "Server module not found" });
				return;
			}

			const render = insertLayoutModuleMetadata({
				jsx: await serverModule.render({
					element: {
						...layoutModule,
						serverModule,
						// @ts-ignore
						parameters: getModuleParameters(layoutModule.parameters),
					},
					// @ts-ignore
					req: req,
				}),
				elementId: layoutModule.id,
				moduleShortName: serverModule.shortName,
				isLoaderSwappable: serverModule.loader != undefined ? true : false,
			});

			res.setHeader("Content-Type", "text/html");
			res.send(renderToString(render));
		},
	}),
	getMany: createRoute({
		handler: async (req, res) => {
			const elementIds = req.parsed.query.elementIds.includes(",")
				? // @ts-ignore
					req.parsed.query.elementIds.split(",")
				: req.parsed.query.elementIds;

			const layoutModules = await db.layoutModule.findMany({
				where: {
					id: {
						in: Array.isArray(elementIds) ? elementIds : [elementIds],
					},
				},
				include: layoutModuleIncludes,
			});

			const elements = layoutModules.map((module) => {
				return {
					...module,
					serverModule: serverModules.find((m) => m.shortName === module.module.shortName),
					parameters: getModuleParameters(module.parameters),
				};
			});

			const data = await Promise.all(
				elements.map(async (e) => {
					if (e.serverModule === undefined) {
						return {
							id: e.id,
							data: null,
						};
					}
					if (e.serverModule.data === undefined) {
						return {
							id: e.id,
							data: null,
						};
					}
					// @ts-ignore
					return { id: e.id, data: await e.serverModule.data(e, req) };
				}),
			);

			res.json({ status: "success", items: data });
		},
		schema: z.object({
			query: z.object({
				elementIds: z.union([z.coerce.string(), z.array(z.coerce.string())]),
			}),
		}),
	}),
	action: createRoute({
		handler: async (req, res) => {
			const elementId = req.parsed.params.elementId;

			const layoutModule = await db.layoutModule.findUnique({
				where: {
					id: elementId,
				},
				include: layoutModuleIncludes,
			});
			if (!layoutModule) {
				res.status(404).json({ status: "error", message: "Layout module not found" });
				return;
			}
			const serverModule = serverModules.find((m) => m.shortName === layoutModule.module.shortName);

			const element = {
				...layoutModule,
				parameters: getModuleParameters(layoutModule.parameters),
				serverModule,
			};
			if (!serverModule || !serverModule.action) {
				res.status(404).json({ status: "error", message: "Server module not found" });
				return;
			}

			if (serverModule.actionSchema) {
				const validatedData = serverModule.actionSchema.safeParse(req.body);
				if (!validatedData.success) {
					res
						.status(400)
						.json({ status: "error", message: "Invalid request: " + validatedData.error.message });
					return;
				}
			}

			try {
				const data = await serverModule.action({
					// @ts-ignore
					element,
					data: req.body,
					// @ts-ignore
					request: req,
				});
				res.json(data);
				return;
			} catch (error: ModuleActionError | any) {
				logMessage({
					functionName: "layoutModulesRouter.action",
					message: "Module action error: " + error,
				});
				res
					.status(error!.statusCode || 500)
					.json({ status: "error", message: error.message || "An unknown error occurred" });
				return;
			}
		},
		schema: z.object({
			params: z.object({
				elementId: z.string(),
			}),
		}),
		//schema: serverModules.map((m) => m.actionSchema).filter((m) => m !== undefined).reduce((acc, m) => acc.concat(m), z.object({})),
	}),
};
