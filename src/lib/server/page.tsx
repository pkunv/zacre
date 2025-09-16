import { LayoutElementError } from "@/components/ui/error";
import { Root } from "@/components/ui/root";
import { pages } from "@/index";
import { getModuleParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { serverModules } from "@/modules/server";
import { renderToString } from "preact-render-to-string";
import { Prisma } from "~/generated/prisma/client";

export const pageIncludes = {
	layout: {
		include: {
			modules: {
				include: {
					module: true,
					parameters: true,
				},
			},
		},
	},
} satisfies Prisma.PageInclude;

export async function getPage(url: string) {
	const page = pages.find((p) => p.url === url);
	if (!page) {
		return {
			html: "<html><body><h1>Page not found</h1></body></html>",
			jsx: [<LayoutElementError elementName="page" id={""} />],
		};
	}
	const layoutModules = page.layout.modules.map((module) => {
		const serverModule = serverModules.find((m) => m.shortName === module.module.shortName);

		const element = {
			...module,
			parameters: getModuleParameters(module.parameters),
		};

		if (serverModule) {
			// @ts-ignore
			const serverModuleComponent = serverModule.loader(element);

			const html = renderToString(serverModuleComponent);
			return {
				html: html,
				jsx: serverModuleComponent,
			};
		}
		return {
			html: renderToString(
				<LayoutElementError elementName={module.module.shortName} id={module.id} />,
			),
			jsx: <LayoutElementError elementName={module.module.shortName} id={module.id} />,
		};
	});

	return {
		...page,
		html: layoutModules.map((module) => module.html).join(""),
		jsx: layoutModules.map((module) => module.jsx),
	};
}

export type Page = Awaited<ReturnType<typeof getPage>>;

export async function renderPage(page: Page, req: RouterRequest) {
	return renderToString(await Root({ req, children: page.jsx }));
}
