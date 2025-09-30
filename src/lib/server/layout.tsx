import { db } from "@/lib/server/db";
import { logMessage } from "@/lib/server/log";
import { VNode } from "preact";
import { Prisma } from "~/generated/prisma/client";

export const layoutModuleIncludes = {
	module: true,
	parameters: true,
} satisfies Prisma.LayoutModuleInclude;

export type RawLayoutModule = Prisma.LayoutModuleGetPayload<{
	include: typeof layoutModuleIncludes;
}>;

export type LayoutElement<T> = Prisma.LayoutModuleGetPayload<{
	include: typeof layoutModuleIncludes;
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

export type CreateLayoutParams = {
	title: string;
	description?: string;
	isActive: boolean;
	modules: {
		shortName?: string;
		x?: number;
		y?: number;
		params: {
			key: string;
			value?: string;
		}[];
	}[];
};

export async function createLayout(params: CreateLayoutParams) {
	const existingLayout = await db.layout.findFirst({
		where: {
			title: params.title,
			description: params.description ?? "",
		},
	});
	if (existingLayout) {
		return existingLayout;
	}
	const layout = await db.layout.create({
		data: {
			title: params.title,
			description: params.description ?? "",
			isActive: params.isActive,
		},
	});

	const modules = await db.module.findMany({
		where: {
			OR: [
				{
					shortName: {
						in: params.modules
							.filter((module) => module.shortName !== undefined)
							.map((module) => module.shortName as string),
					},
				},
			],
		},
	});

	for (const module of params.modules) {
		const moduleId = modules.find((m) => m.shortName === module.shortName)?.id;
		if (!moduleId) {
			logMessage({
				functionName: "createLayout",
				message: `Warning: Module ${module.shortName} not found`,
			});

			continue;
		}
		const layoutModule = await db.layoutModule.create({
			data: {
				layoutId: layout.id,
				moduleId,
				x: module.x ?? 0,
				y: module.y ?? 0,
			},
		});
		await db.layoutModuleParameter.createMany({
			data: module.params.map((p) => ({
				layoutModuleId: layoutModule.id,
				key: `${module.shortName}.${p.key}`,
				value: p.value ?? "",
			})),
		});
	}

	return layout;
}

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
