import { LayoutElementError } from "@/components/ui/error";
import { Root } from "@/components/ui/root";
import { pages } from "@/index";
import { db } from "@/lib/server/db";
import { insertLayoutModuleMetadata } from "@/lib/server/layouts/get";
import { getLayoutModuleParameters } from "@/lib/server/parameter";
import { RouterRequest } from "@/lib/server/typed-router";
import { PaginatedResponse } from "@/lib/server/utils";
import { serverModules } from "@/modules/server";
import { renderToString } from "preact-render-to-string";
import { Feature, Prisma } from "~/generated/prisma/client";

export const pageIncludes = {
	createdBy: true,
	updatedBy: true,
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

export type Page = Prisma.PageGetPayload<{
	include: typeof pageIncludes;
}>;

export async function assemblePage({
	url,
	id,
	req,
}: {
	url?: string;
	id?: string;
	req: RouterRequest;
}) {
	const page = pages.find((p) => p.url === url || p.id === id);
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
				try {
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
				} catch (error) {
					return {
						x: layoutModule.x,
						y: layoutModule.y,
						jsx: (
							<LayoutElementError
								elementName={layoutModule.module.shortName}
								id={layoutModule.id}
							/>
						),
					};
				}
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

export type AssembledPage = Awaited<ReturnType<typeof assemblePage>>;

export async function renderPageToHTML(page: AssembledPage, req: RouterRequest) {
	return `<!DOCTYPE html>${renderToString(await Root({ req, children: page.jsx }))}`;
}

export type GetPagesParams = {
	url?: string;
	id?: string;
	name?: string;
	layoutId?: string;
	createdById?: string;
	updatedById?: string;
	description?: string;
	isActive?: boolean;
	isLocked?: boolean;
	assignedFeature?: Feature;
	role?: string;
	page?: number;
	limit?: number;
	orderBy?: {
		createdAt?: "asc" | "desc";
		updatedAt?: "asc" | "desc";
		title?: "asc" | "desc";
		url?: "asc" | "desc";
		layoutId?: "asc" | "desc";
	};
};

export async function getPages(params: GetPagesParams): Promise<PaginatedResponse<Page>> {
	const whereClause = {
		title: params.name,
		description: params.description,
		isActive: params.isActive,
		isLocked: params.isLocked,
		assignedFeature: params.assignedFeature,
		role: params.role,
		layoutId: params.layoutId,
		createdById: params.createdById,
		updatedById: params.updatedById,
	} satisfies Prisma.PageWhereInput;

	const pages = await db.page.findMany({
		where: whereClause,
		skip: (params.page || 1 - 1) * (params.limit || 10),
		take: params.limit,
		orderBy: params.orderBy
			? {
					createdAt: params.orderBy.createdAt || "asc",
					updatedAt: params.orderBy.updatedAt || "asc",
					title: params.orderBy.title || "asc",
					url: params.orderBy.url || "asc",
					layoutId: params.orderBy.layoutId || "asc",
				}
			: {
					createdAt: "desc",
					updatedAt: "desc",
					title: "desc",
					url: "desc",
					layoutId: "desc",
				},
		include: pageIncludes,
	});

	const total = await db.page.count({
		where: whereClause,
	});

	return {
		currentPage: params.page || 1,
		filters: null,
		totalPages: Math.ceil(total / (params.limit || 10)),
		totalItems: total,
		perPage: params.limit || 10,
		items: pages,
	};
}
