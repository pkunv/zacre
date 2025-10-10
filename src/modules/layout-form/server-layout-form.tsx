import { H1, H2 } from "@/components/modules-ui/typography";
import { LayoutElementError } from "@/components/ui/error";
import { reloadPages } from "@/index";
import { db } from "@/lib/server/db";
import { Layout, layoutIncludes } from "@/lib/server/layout";
import { actionRedirect, ParameterDefinition, ServerModule } from "@/modules/server";
import { z } from "zod";
import { ParameterTypeEnum } from "~/generated/prisma/client";

export const layoutFormParameters = [] as const satisfies readonly ParameterDefinition<string>[];

export type LayoutFormData = {
	layout: Layout | null;
	allParameterTypes: Array<{
		key: string;
		type: ParameterTypeEnum;
		isRequired: boolean;
	}>;
	allModules: Array<{
		id: string;
		shortName: string;
		name: string;
	}>;
};

const layoutFormActionSchema = z.object({
	layoutId: z.string().optional(),
	title: z.string(),
	description: z.string(),
	modules: z.array(
		z.object({
			layoutModuleId: z.string(),
			moduleId: z.string(),
			x: z.number(),
			y: z.number(),
			parameters: z.array(
				z.object({
					key: z.string(),
					value: z.string(),
				}),
			),
		}),
	),
});

export const serverLayoutForm: ServerModule<
	typeof layoutFormParameters,
	z.infer<typeof layoutFormActionSchema>
> = {
	shortName: "layout-form",
	name: "Layout form",
	description: "Module that allows to create and edit a layout.",
	createdAt: new Date("2025-09-22"),
	loader: ({ element }) => {
		return (
			<form class="w-full h-full p-4">
				<H1 className="text-left skeleton w-24 h-12"> </H1>
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<H2 className="card-title">Overview</H2>
						{/* Title input */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Title</legend>
							<input
								type="text"
								placeholder="Layout Title..."
								class="input input-xl skeleton "
								name="title"
								required
							/>
						</fieldset>

						{/* Description input */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Description</legend>
							<input
								type="text"
								placeholder="Layout Description..."
								class="input input-md skeleton "
								name="description"
							/>
							<p class="label">Optional</p>
						</fieldset>
					</div>
				</div>
				<div class="flex flex-col gap-4 skeleton min-w-full min-h-96"></div>
			</form>
		);
	},
	render: async ({ element, req }) => {
		const isEditMode = req.params.layoutId && req.params.layoutId !== "new";

		let layout: Layout | null = null;
		if (isEditMode) {
			layout = await db.layout.findFirst({
				include: layoutIncludes,
				where: {
					id: req.params.layoutId,
				},
			});

			if (!layout) {
				return <LayoutElementError elementName="layout-form" id={element.id} />;
			}
		}

		// Get all available parameter types
		const allParameterTypes = await db.parameterType.findMany({
			select: {
				key: true,
				type: true,
				isRequired: true,
			},
		});

		// Get all available modules
		const allModules = await db.module.findMany({
			select: {
				id: true,
				shortName: true,
				name: true,
			},
		});

		return (
			<form class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4">
				<H1 className="text-left">{`${isEditMode ? "Edit" : "Create"} Layout`}</H1>
				{/* Hidden field for layout ID */}
				<input type="hidden" name="layoutId" value={layout?.id || ""} />
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<H2 className="card-title">Overview</H2>
						{/* Title input */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Title</legend>
							<input
								type="text"
								placeholder="Layout Title..."
								class="input input-xl"
								name="title"
								value={layout?.title || ""}
								required
							/>
						</fieldset>

						{/* Description input */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Description</legend>
							<input
								type="text"
								placeholder="Layout Description..."
								class="input input-md"
								name="description"
								value={layout?.description || ""}
							/>
							<p class="label">Optional</p>
						</fieldset>
					</div>
				</div>

				{/* Modules container */}
				<div id="modules-container" class="flex flex-col gap-4 min-w-full">
					{layout?.modules.map((layoutModule, index) => (
						<div
							class="card bg-base-200 module-item"
							data-layout-module-id={layoutModule.id}
							data-module-id={layoutModule.moduleId}
							data-x={layoutModule.x}
							data-y={layoutModule.y}
							draggable={true}
						>
							<div class="card-body gap-4">
								{/* Module header with drag handle */}
								<div class="flex flex-row items-center gap-4 w-full justify-between">
									<div class="flex flex-row items-center gap-4">
										<i data-lucide="grip-vertical" class="w-5 h-5 cursor-move drag-handle"></i>
										<img src="/logo-sm.webp" alt="Module" class="w-8 h-8" />
										<H2 className="m-0 p-0">{layoutModule.module.name}</H2>
										<label class="input input-sm">
											<span class="label-text">X:</span>
											<input
												type="number"
												data-module-x={layoutModule.id}
												value={layoutModule.x}
												class="w-12 text-left ml-2"
												readonly
											/>
										</label>
										<label class="input input-sm">
											<span class="label-text">Y:</span>
											<input
												type="number"
												data-module-y={layoutModule.id}
												value={layoutModule.y}
												class="w-12 text-left ml-2"
												readonly
											/>
										</label>
									</div>
									<button
										type="button"
										class="btn btn-sm btn-error delete-module-btn"
										data-module-id={layoutModule.id}
									>
										<i class="w-4 h-4" data-lucide="trash"></i>
									</button>
								</div>

								{/* Parameters section */}
								<div class="flex flex-col gap-2">
									<div
										class="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 bg-base-100 rounded"
										data-parameters-container={layoutModule.id}
									>
										{layoutModule.parameters.map((parameter) => (
											<div class="flex flex-row items-center gap-2 parameter-item">
												<label class="flex-1 input input-sm flex flex-row items-center">
													<span class="label-text min-w-32">{parameter.parameter.key}</span>
													<input
														type={
															parameter.parameter.type === ParameterTypeEnum.STRING
																? "text"
																: parameter.parameter.type === ParameterTypeEnum.NUMBER
																	? "number"
																	: "text"
														}
														data-parameter-key={parameter.parameter.key}
														data-layout-module-id={layoutModule.id}
														value={parameter.value}
														class="flex-1 ml-2"
													/>
												</label>
												<button
													type="button"
													class="btn btn-xs btn-ghost delete-parameter-btn"
													data-parameter-key={parameter.parameter.key}
													data-layout-module-id={layoutModule.id}
												>
													<i class="w-3 h-3" data-lucide="x"></i>
												</button>
											</div>
										))}
									</div>

									{/* Add parameter section */}
									<div class="flex flex-row gap-2 items-center">
										<select class="select select-sm flex-1" data-parameter-select={layoutModule.id}>
											<option value="">Select parameter to add...</option>
											{allParameterTypes
												.filter(
													(pt) =>
														pt.key.startsWith(`${layoutModule.module.shortName}.`) &&
														!layoutModule.parameters.some((p) => p.parameter.key === pt.key),
												)
												.map((pt) => (
													<option value={pt.key}>{pt.key}</option>
												))}
										</select>
										<button
											type="button"
											class="btn btn-sm btn-primary add-parameter-btn"
											data-layout-module-id={layoutModule.id}
										>
											<i class="w-4 h-4" data-lucide="plus"></i>
											Add
										</button>
									</div>
								</div>
							</div>

							{/* Drop zones */}
							<div
								class="drop-zone drop-zone-top"
								data-position="top"
								data-target-module-id={layoutModule.id}
							></div>
							<div
								class="drop-zone drop-zone-bottom"
								data-position="bottom"
								data-target-module-id={layoutModule.id}
							></div>
							<div
								class="drop-zone drop-zone-left"
								data-position="left"
								data-target-module-id={layoutModule.id}
							></div>
							<div
								class="drop-zone drop-zone-right"
								data-position="right"
								data-target-module-id={layoutModule.id}
							></div>
						</div>
					))}
				</div>

				{/* Add module button */}
				<div class="flex flex-row gap-2 items-center">
					<select class="select select-md flex-1" id="new-module-select">
						<option value="">Select module to add...</option>
						{allModules.map((module) => (
							<option value={module.id} data-short-name={module.shortName}>
								{module.name}
							</option>
						))}
					</select>
					<button type="button" class="btn btn-md btn-primary" id="add-module-btn">
						<i class="w-4 h-4" data-lucide="plus"></i>
						Add Module
					</button>
				</div>

				{/* Save button */}
				<button type="submit" class="btn btn-lg btn-primary">
					<i class="w-4 h-4" data-lucide="save"></i>
					Save Layout
				</button>

				{/* Confirmation modal */}
				<dialog id="delete-module-modal" class="modal">
					<div class="modal-box">
						<h3 class="font-bold text-lg">Confirm Deletion</h3>
						<p class="py-4">Are you sure you want to remove this module from the layout?</p>
						<div class="modal-action">
							<button type="button" class="btn" id="cancel-delete-btn">
								Cancel
							</button>
							<button type="button" class="btn btn-error" id="confirm-delete-btn">
								<i class="w-4 h-4" data-lucide="trash"></i>
								Delete
							</button>
						</div>
					</div>
					<form method="dialog" class="modal-backdrop">
						<button>close</button>
					</form>
				</dialog>
			</form>
		);
	},
	data: async (element, req) => {
		const isEditMode = req.params.layoutId && req.params.layoutId !== "new";

		let layout: Layout | null = null;
		if (isEditMode) {
			layout = await db.layout.findFirst({
				include: layoutIncludes,
				where: {
					id: req.params.layoutId,
				},
			});
		}

		const allParameterTypes = await db.parameterType.findMany({
			select: {
				key: true,
				type: true,
				isRequired: true,
			},
		});

		const allModules = await db.module.findMany({
			select: {
				id: true,
				shortName: true,
				name: true,
			},
		});

		return {
			layout,
			allParameterTypes,
			allModules,
		} satisfies LayoutFormData;
	},
	actionSchema: layoutFormActionSchema as any,
	action: async ({ element, data, request }) => {
		const { layoutId, title, description, modules } = data;

		// If layoutId exists, update the layout, otherwise create a new one
		if (layoutId) {
			// Update existing layout
			await db.layout.update({
				where: { id: layoutId },
				data: {
					title,
					description,
					updatedAt: new Date(),
				},
			});

			// Delete all existing layout modules and their parameters
			await db.layoutModule.deleteMany({
				where: { layoutId },
			});
		}

		// Create or get the layout
		const layout = layoutId
			? await db.layout.findUnique({ where: { id: layoutId } })
			: await db.layout.create({
					data: {
						title,
						description,
						isActive: true,
					},
				});

		if (!layout) {
			throw new Error("Failed to create or find layout");
		}

		// Create all layout modules with their parameters
		for (const module of modules) {
			// Remove duplicates by key and filter out undefined values
			const uniqueParameters = module.parameters
				.filter((param) => param.value !== undefined)
				.reduce(
					(acc, param) => {
						acc[param.key] = param;
						return acc;
					},
					{} as Record<string, { key: string; value: string }>,
				);

			const parameters = Object.values(uniqueParameters);

			const layoutModule = await db.layoutModule.create({
				data: {
					layoutId: layout.id,
					moduleId: module.moduleId,
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
						value: param.value,
					})),
				});
			}
		}

		await reloadPages();

		return actionRedirect({
			url: `/admin/layouts`,
			message: layoutId ? "Layout updated successfully" : "Layout created successfully",
		});
	},
};
