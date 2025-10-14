import { db } from "@/lib/server/db";
import { logMessage } from "@/lib/server/log";

export type CreateLayoutParams = {
	title: string;
	description?: string;
	isActive: boolean;
	modules: {
		id?: string;
		shortName: string;
		x: number;
		y: number;
		parameters: {
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
				{
					id: {
						in: params.modules
							.filter((module) => module.id !== undefined)
							.map((module) => module.id as string),
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
			data: module.parameters.map((p) => ({
				layoutModuleId: layoutModule.id,
				key: `${module.shortName}.${p.key}`,
				value: p.value ?? "",
			})),
		});
	}

	return layout;
}
