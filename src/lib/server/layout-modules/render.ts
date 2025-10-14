import { pages } from "@/index";
import { db } from "@/lib/server/db";
import { insertLayoutModuleMetadata, layoutModuleIncludes } from "@/lib/server/layouts/get";
import { getLayoutModuleParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { getRefererRequestParams, getRefererRequestSearchQueryParams } from "@/lib/server/utils";
import { serverModules } from "@/modules/server";
import renderToString from "preact-render-to-string";

export async function renderLayoutModule({
	elementId,
	req,
}: {
	elementId: string;
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

	if (!serverModule) {
		throw new Error("Server module not found", { cause: { statusCode: 404 } });
	}
	if (!serverModule.render) {
		throw new Error("Server module render not found", { cause: { statusCode: 404 } });
	}

	const page = pages.find((p) => p.layout.id === layoutModule.layoutId);

	if (!page) {
		throw new Error("Page not found", { cause: { statusCode: 404 } });
	}

	const render = insertLayoutModuleMetadata({
		jsx: await serverModule.render({
			element: {
				...layoutModule,

				parameters: getLayoutModuleParameters(layoutModule),
			},
			// @ts-ignore
			req: {
				...req,
				data: {
					params: getRefererRequestParams({ req: req as RouterRequest, pageUrl: page.url }),
					query: getRefererRequestSearchQueryParams({
						req: req as RouterRequest,
						pageUrl: page.url,
					}),
					body: {},
				},
			},
		}),
		elementId: layoutModule.id,
		moduleShortName: serverModule.shortName,
		isLoaderSwappable: serverModule.loader != undefined ? true : false,
	});

	return renderToString(render);
}
