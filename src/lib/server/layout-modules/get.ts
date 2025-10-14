import { db } from "@/lib/server/db";
import { layoutModuleIncludes } from "@/lib/server/layouts/get";
import { getLayoutModuleParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { serverModules } from "@/modules/server";

export async function getLayoutModulesData({
	elementIds,
	req,
}: {
	elementIds: string[];
	req: RouterRequest;
}) {
	const layoutModules = await db.layoutModule.findMany({
		where: {
			id: {
				in: elementIds,
			},
		},
		include: layoutModuleIncludes,
	});

	const elements = layoutModules.map((layoutModule) => {
		return {
			...layoutModule,
			serverModule: serverModules.find((m) => m.shortName === layoutModule.module.shortName),
			parameters: getLayoutModuleParameters(layoutModule),
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

	return data;
}
