import { db } from "@/lib/server/db";
import { layoutModuleIncludes } from "@/lib/server/layout";
import { getModuleParameters } from "@/lib/server/parameter";
import { createRoute } from "@/lib/server/typed-router";
import { serverModules } from "@/modules/server";
import { z } from "zod/v3";

export const layoutModulesRouter = {
	getMany: createRoute({
		handler: async (req, res) => {
			const elementIds = req.parsed.query.elementIds;

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
					return { id: e.id, data: await e.serverModule.data(e) };
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
	get: createRoute({
		handler: async (req, res) => {
			const elementId = req.parsed.params.elementId;

			const layoutModule = await db.layoutModule.findUnique({
				include: layoutModuleIncludes,
				where: {
					id: elementId,
				},
			});

			if (!layoutModule) {
				res.status(404).json({ status: "error", message: "Layout module not found" });
				return;
			}

			const element = {
				...layoutModule,
				parameters: getModuleParameters(layoutModule.parameters),
			};

			const serverModule = serverModules.find((m) => m.shortName === layoutModule.module.shortName);

			if (!serverModule || !serverModule.data) {
				res.status(404).json({ status: "error", message: "Server module not found" });
				return;
			}

			// @ts-ignore
			const data = await serverModule.data(element);

			res.json({ status: "success", item: element });
		},
		schema: z.object({
			params: z.object({
				elementId: z.string(),
			}),
		}),
	}),
};
