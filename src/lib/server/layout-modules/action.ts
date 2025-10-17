import { db } from "@/lib/server/db";
import { layoutModuleIncludes } from "@/lib/server/layouts/get";
import { getLayoutModuleParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { serverModules } from "@/modules/server";

export async function executeLayoutModuleAction({
	elementId,
	data,
	req,
}: {
	elementId: string;
	data?: unknown;
	req: RouterRequest;
}) {
	const layoutModule = await db.layoutModule.findUnique({
		where: {
			id: elementId,
		},
		include: layoutModuleIncludes,
	});
	if (!layoutModule) {
		throw new Error("Layout module not found", { cause: { statusCode: 404 } });
	}
	const serverModule = serverModules.find((m) => m.shortName === layoutModule.module.shortName);

	const element = {
		...layoutModule,
		parameters: getLayoutModuleParameters(layoutModule) as Record<string, string | undefined>,
		serverModule,
	};
	if (!serverModule) {
		throw new Error("Server module not found", { cause: { statusCode: 404 } });
	}
	if (!serverModule.action) {
		throw new Error("Server module action not found", { cause: { statusCode: 404 } });
	}

	if (serverModule.actionSchema) {
		const validatedData = serverModule.actionSchema.safeParse(data);
		if (!validatedData.success) {
			throw new Error("Invalid request: " + validatedData.error.message, {
				cause: { statusCode: 400 },
			});
		}
	}
	return await serverModule.action({
		// @ts-ignore Parameters cannot be typed because of literals
		element,
		data,
		request: req,
	});
}
