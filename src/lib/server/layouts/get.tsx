import { db } from "@/lib/server/db";
import { PaginatedResponse } from "@/lib/server/utils";
import { VNode } from "preact";
import { Prisma } from "~/generated/prisma/client";

export const layoutModuleIncludes = {
	module: true,
	parameters: true,
} satisfies Prisma.LayoutModuleInclude;

export const layoutModuleWithoutParametersIncludes = {
	module: true,
} satisfies Prisma.LayoutModuleInclude;

export type LayoutModule = Prisma.LayoutModuleGetPayload<{
	include: typeof layoutModuleIncludes;
}>;
// for "element" parameter in server modules
export type LayoutModuleElement<T> = Prisma.LayoutModuleGetPayload<{
	include: typeof layoutModuleWithoutParametersIncludes;
}> & {
	parameters: Record<T extends { key: string } ? T["key"] : never, string | undefined>;
};

export const layoutIncludes = {
	pages: true,
	modules: {
		include: {
			module: true,
			parameters: {
				include: {
					parameter: true,
				},
			},
		},
	},
} satisfies Prisma.LayoutInclude;

export type Layout = Prisma.LayoutGetPayload<{
	include: typeof layoutIncludes;
}>;

export function insertLayoutModuleMetadata({
	elementId,
	moduleShortName,
	isLoaderSwappable,
	jsx,
}: {
	elementId: string;
	moduleShortName: string;
	isLoaderSwappable: boolean;
	jsx: VNode;
}) {
	// If jsx is not a valid VNode with a type, return it as-is
	if (!jsx || typeof jsx.type !== "string") {
		return jsx;
	}

	// Instead of creating a new VNode, modify the props directly
	// This preserves all internal Preact properties
	if (jsx.props) {
		jsx.props = {
			...jsx.props,
			"data-element-id": elementId,
			"data-module": moduleShortName,
			"data-is-loader-swappable": String(isLoaderSwappable),
		} as any;
	} else {
		jsx.props = {
			"data-element-id": elementId,
			"data-module": moduleShortName,
			"data-is-loader-swappable": String(isLoaderSwappable),
		} as any;
	}

	return jsx;
}

type GetLayoutsParams = {
	title?: string;
	description?: string;
	isActive?: boolean;
	id?: string;
	modules?: {
		shortName?: string;
		id?: string;
	}[];
	page?: number;
	limit?: number;
	orderBy?: {
		createdAt?: "asc" | "desc";
		updatedAt?: "asc" | "desc";
		title?: "asc" | "desc";
	};
};

export async function getLayouts(params: GetLayoutsParams): Promise<PaginatedResponse<Layout>> {
	const { title, description, isActive, id, modules, page, limit, orderBy } = params;

	const whereClause = {
		id,
		title,
		description,
		isActive,
		modules: {
			some:
				modules && modules.length > 0
					? {
							module: {
								shortName: {
									in: modules
										.filter((m): m is { shortName: string; id?: string } => !!m.shortName)
										.map((m) => m.shortName),
								},
							},
						}
					: undefined,
		},
	} satisfies Prisma.LayoutWhereInput;

	const layouts = await db.layout.findMany({
		skip: (page || 1 - 1) * (limit || 10),
		take: limit,
		where: whereClause,
		orderBy: orderBy
			? ({
					title: orderBy.title || "asc",
				} satisfies Prisma.LayoutOrderByWithRelationInput)
			: ({
					title: "desc",
				} satisfies Prisma.LayoutOrderByWithRelationInput),
		include: layoutIncludes,
	});

	const total = await db.layout.count({
		where: whereClause,
	});

	return {
		currentPage: params.page || 1,
		filters: null,
		totalPages: Math.ceil(total / (params.limit || 10)),
		totalItems: total,
		perPage: params.limit || 10,
		items: layouts,
	};
}
