import { Button } from "@/components/modules-ui/button";
import { Input, Select } from "@/components/modules-ui/input";
import { LayoutCard } from "@/components/modules-ui/layout-card";
import { H1, H2, H3 } from "@/components/modules-ui/typography";
import { LayoutElementError } from "@/components/ui/error";
import { db } from "@/lib/server/db";
import { Layout, layoutIncludes } from "@/lib/server/layouts/get";
import { Page, pageIncludes } from "@/lib/server/pages/get";
import { capitalize } from "@/lib/server/utils";
import { ParameterDefinition, ServerModule } from "@/modules/server";
import { Feature } from "~/generated/prisma/client";

export const pageFormParameters = [] as const satisfies readonly ParameterDefinition<string>[];

export type PageFormData = {
	allLayouts: Layout[];
	features: string[];
};

export const serverPageForm: ServerModule<typeof pageFormParameters, unknown> = {
	shortName: "page-form",
	name: "Page form",
	description: "Module that allows to create and edit a page.",
	createdAt: new Date("2025-10-12"),
	loader: ({ element }) => {
		return (
			<form class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4">
				<H1 className="text-left skeleton w-24 h-12"> </H1>
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<H2 className="card-title">Overview</H2>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Title</legend>
							<input
								type="text"
								placeholder="Page Title..."
								class="input input-xl skeleton"
								name="title"
								required
							/>
						</fieldset>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Description</legend>
							<input
								type="text"
								placeholder="Page Description..."
								class="input input-md skeleton"
								name="description"
							/>
						</fieldset>
						<div class="flex flex-col gap-4 skeleton min-w-full min-h-96"></div>
					</div>
				</div>
			</form>
		);
	},
	render: async ({ element, req }) => {
		const isEditMode = req.data.params.pageId && req.data.params.pageId !== "new";

		let page: Page | null = null;
		if (isEditMode) {
			page = await db.page.findFirst({
				include: pageIncludes,
				where: {
					id: req.data.params.pageId,
				},
			});

			if (!page) {
				return <LayoutElementError elementName="page-form" id={element.id} />;
			}
		}

		const allLayouts = await db.layout.findMany({
			include: layoutIncludes,
		});

		const features = Object.values(Feature);

		return (
			<form class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4">
				<H1 className="text-left">{`${isEditMode ? "Edit" : "Create"} Page`}</H1>
				<input type="hidden" name="pageId" value={page?.id || ""} />
				<input type="hidden" name="layoutId" id="layout-id-input" value={page?.layoutId || ""} />

				<div class="card bg-base-100 shadow-sm">
					<div class="card-body">
						<H2 className="card-title">Overview</H2>

						{/* Title input */}
						<Input label="Title" name="title" value={page?.title || ""} required />
						<Input label="Description" name="description" value={page?.description || ""} />

						{/* URL input */}
						<Input
							label="Address"
							name="url"
							value={page?.url || ""}
							required
							helperText="Must start with /"
						/>

						{/* @ts-expect-error - problem with type definition but it's ok */}
						<Select label="Feature" name="assignedFeature">
							<option disabled>Select a feature...</option>
							<option value="" selected={page?.assignedFeature === null}>
								None
							</option>
							{features.map((feature) => (
								<option value={feature} selected={page?.assignedFeature === feature}>
									{capitalize(feature)}
								</option>
							))}
						</Select>

						{/* Layout selection */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Layout</legend>
							<button
								type="button"
								id="select-layout-btn"
								class="btn btn-md btn-outline w-80"
								data-layout-name={page?.layout?.title || ""}
							>
								<i class="w-4 h-4" data-lucide="layout"></i>
								<span id="selected-layout-text">{page?.layout?.title || "Select a layout..."}</span>
							</button>
							<p class="label">Required</p>
						</fieldset>

						{/* Is Active toggle */}
						<Input
							label="Active"
							name="isActive"
							type="checkbox"
							checked={page?.isActive ?? true}
						/>
					</div>
				</div>

				{/* Action buttons */}
				<div class="flex flex-row w-full justify-end gap-4">
					<Button type="submit" iconName="save">
						Save
					</Button>
					<Button
						type="button"
						typeOption="error"
						iconName="trash"
						id="delete-page-btn"
						disabled={page?.isLocked ?? false}
					>
						Delete
					</Button>
				</div>

				{/* Layout selection modal */}
				<dialog id="layout-selection-modal" class="modal">
					<div class="modal-box max-w-4xl">
						<H3>Select Layout</H3>
						<div class="py-4 flex flex-col gap-4">
							{/* Search input */}
							<Input
								type="text"
								placeholder="Search layouts..."
								id="layout-search-input"
								icon="search"
							/>
							{/* Layouts list */}
							<div class="flex flex-col gap-4 max-h-96 overflow-y-auto" id="layouts-list">
								{allLayouts.map((layout) => (
									<LayoutCard layout={layout}>
										<Button
											type="button"
											className="select-layout-btn"
											iconName="check"
											data-layout-id={layout.id}
											data-layout-title={layout.title}
										>
											Select
										</Button>
									</LayoutCard>
								))}
							</div>
						</div>
						<div class="modal-action">
							<Button type="button" id="cancel-layout-selection-btn" iconName="x">
								Cancel
							</Button>
						</div>
					</div>
					<form method="dialog" class="modal-backdrop">
						<button>close</button>
					</form>
				</dialog>

				{/* Delete page modal */}
				<dialog id="delete-page-modal" class="modal">
					<div class="modal-box">
						<h3 class="font-bold text-lg">Confirm Deletion</h3>
						<p class="py-4">Are you sure you want to delete this page?</p>
						<div class="modal-action">
							<button type="button" class="btn" id="cancel-delete-page-btn">
								Cancel
							</button>
							<button type="button" class="btn btn-error" id="confirm-delete-page-btn">
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
		const allLayouts = await db.layout.findMany({
			include: layoutIncludes,
		});

		const features = Object.values(Feature);

		return {
			allLayouts,
			features,
		} satisfies PageFormData;
	},
};
