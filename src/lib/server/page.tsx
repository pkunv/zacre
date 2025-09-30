import { LayoutElementError } from "@/components/ui/error";
import { Root } from "@/components/ui/root";
import { pages } from "@/index";
import { db } from "@/lib/server/db";
import { insertLayoutModuleMetadata } from "@/lib/server/layout";
import { getLayoutModuleParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { serverModules } from "@/modules/server";
import { renderToString } from "preact-render-to-string";
import { Feature, Prisma } from "~/generated/prisma/client";

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

export type RawPage = Prisma.PageGetPayload<{
	include: typeof pageIncludes;
}>;

export async function getPage({ url, req }: { url: string; req: RouterRequest }) {
	const page = pages.find((p) => p.url === url);
	if (!page) {
		return {
			jsx: [<LayoutElementError elementName="page" id={""} />],
		};
	}
	const layoutModules = await Promise.all(
		page.layout.modules.map(async (layoutModule) => {
			const serverModule = serverModules.find((m) => m.shortName === layoutModule.module.shortName);

			const element = {
				...layoutModule,
				parameters: getLayoutModuleParameters(layoutModule),
			};

			if (serverModule) {
				// @ts-ignore
				const serverModuleResult = serverModule.loader ? (
					// @ts-ignore
					serverModule.loader({ req, element })
				) : serverModule.render ? (
					// @ts-ignore
					await serverModule.render({ req, element })
				) : (
					<LayoutElementError elementName={layoutModule.module.shortName} id={layoutModule.id} />
				);

				const serverModuleComponent = insertLayoutModuleMetadata({
					elementId: layoutModule.id,
					moduleShortName: layoutModule.module.shortName,
					isLoaderSwappable: serverModule.loader != undefined ? true : false,
					jsx: serverModuleResult,
				});

				return {
					x: layoutModule.x,
					y: layoutModule.y,
					jsx: serverModuleComponent,
				};
			}
			return {
				x: layoutModule.x,
				y: layoutModule.y,
				jsx: (
					<LayoutElementError elementName={layoutModule.module.shortName} id={layoutModule.id} />
				),
			};
		}),
	).then((modules) => modules.sort((a, b) => a.y - b.y));

	// Group modules by Y (rows) and order by X within each row
	const modulesByY = layoutModules.reduce(
		(acc, module) => {
			(acc[module.y] ||= []).push(module);
			return acc;
		},
		{} as Record<number, typeof layoutModules>,
	);

	const rows = Object.keys(modulesByY)
		.map((key) => Number(key))
		.sort((a, b) => a - b)
		.map((y) => {
			const ordered = modulesByY[y].slice().sort((a, b) => a.x - b.x);
			return {
				jsx: <div class="flex flex-row gap-4">{ordered.map((m) => m.jsx)}</div>,
			};
		});

	return {
		...page,
		jsx: rows.map((r) => r.jsx),
	};
}

export type Page = Awaited<ReturnType<typeof getPage>>;

export async function renderPage(page: Page, req: RouterRequest) {
	return `<!DOCTYPE html>${renderToString(await Root({ req, children: page.jsx }))}`;
}

export type CreatePageParams = {
	title: string;
	description: string;
	url: string;
	layoutId: string;
	createdById: string;
	updatedById: string;
	isLocked: boolean;
	assignedFeature?: Feature;
	role?: string;
};

export async function createPage(params: CreatePageParams) {
	const layout = await db.layout.findUnique({
		where: {
			id: params.layoutId,
		},
	});
	if (!layout) {
		throw new Error("Layout not found");
	}
	const existingPage = await db.page.findUnique({
		where: {
			url: params.url,
		},
	});
	if (existingPage) {
		return existingPage;
	}
	const page = await db.page.create({
		data: {
			title: params.title,
			description: params.description,
			url: params.url,
			layoutId: params.layoutId,
			createdById: params.createdById,
			updatedById: params.updatedById,
			role: params.role || undefined,
			isLocked: params.isLocked,
			assignedFeature: params.assignedFeature || undefined,
		},
	});
	return page;
}
