import { db } from "@/lib/server/db";
import { logMessage } from "@/lib/server/log";

export type CreateLayoutParams = {
	title: string;
	description?: string;
	isActive: boolean;
	modules: {
		id: string;
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

	const modules = await db.module
		.findMany({
			where: {
				id: {
					in: params.modules
						.filter((module) => module.id !== undefined)
						.map((module) => module.id as string),
				},
			},
		})
		.then((modules) => {
			return modules.map((module) => {
				return {
					...module,
					...params.modules.find((m) => m.id === module.id),
				};
			});
		});

	for (const module of modules) {
		if (!module.x || !module.y || !module.parameters) {
			logMessage({
				functionName: "createLayout",
				message: `Warning: Module ${module.id} has no x or y position`,
			});

			continue;
		}
		const layoutModule = await db.layoutModule.create({
			data: {
				layoutId: layout.id,
				moduleId: module.id,
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
