import { db } from "@/lib/server/db";

export type UpdateLayoutParams = {
	id: string;
	title?: string;
	description?: string;
	isActive?: boolean;
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

export async function updateLayout(params: UpdateLayoutParams) {
	const layout = await db.layout.findFirst({
		where: {
			id: params.id,
		},
	});
	if (!layout) {
		throw new Error("Layout not found", { cause: { statusCode: 404 } });
	}
	// Update existing layout
	await db.layout.update({
		where: { id: params.id },
		data: {
			title: params.title,
			description: params.description,
			updatedAt: new Date(),
		},
	});

	// Delete all existing layout modules and their parameters
	await db.layoutModule.deleteMany({
		where: { layoutId: params.id },
	});
	// Create all layout modules with their parameters
	for (const module of params.modules) {
		// Remove duplicates by key and filter out undefined values
		const uniqueParameters = module.parameters
			.filter((param) => param.value !== undefined)
			.reduce(
				(acc, param) => {
					acc[param.key] = param;
					return acc;
				},
				{} as Record<string, { key: string; value?: string | undefined }>,
			);

		const parameters = Object.values(uniqueParameters);

		const layoutModule = await db.layoutModule.create({
			data: {
				layoutId: layout.id,
				moduleId: module.id,
				x: module.x,
				y: module.y,
			},
		});

		// Create parameters if any exist
		if (parameters.length > 0) {
			await db.layoutModuleParameter.createMany({
				data: parameters.map((param) => ({
					layoutModuleId: layoutModule.id,
					key: param.key,
					value: param.value ?? "",
				})),
			});
		}
	}

	return layout;
}
