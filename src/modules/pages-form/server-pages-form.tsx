import { H1, H2 } from "@/components/modules-ui/typography";
import { LayoutElementError } from "@/components/ui/error";
import { reloadPages } from "@/index";
import { db } from "@/lib/server/db";
import { Layout, layoutIncludes } from "@/lib/server/layouts/get";
import { actionRedirect, ParameterDefinition, ServerModule } from "@/modules/server";
import { z } from "zod";
import { Feature, Prisma } from "~/generated/prisma/client";

export const pagesFormParameters = [] as const satisfies readonly ParameterDefinition<string>[];

const pageIncludes = {
	layout: true,
	createdBy: true,
	updatedBy: true,
} satisfies Prisma.PageInclude;

type PageData = Prisma.PageGetPayload<{
	include: typeof pageIncludes;
}>;

export type PagesFormData = {
	page: PageData | null;
	allLayouts: Layout[];
	features: string[];
};

const pagesFormActionSchema = z.object({
	pageId: z.string().optional(),
	title: z.string(),
	description: z.string(),
	url: z.string(),
	layoutId: z.string(),
	isActive: z.boolean(),
	assignedFeature: z.string().optional(),
	method: z.enum(["CREATE", "UPDATE", "DELETE"]),
});

export const serverPagesForm: ServerModule<
	typeof pagesFormParameters,
	z.infer<typeof pagesFormActionSchema>
> = {
	shortName: "pages-form",
	name: "Pages form",
	description: "Module that allows to create and edit pages.",
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
		const isEditMode = req.params.pageId && req.params.pageId !== "new";

		let page: PageData | null = null;
		if (isEditMode) {
			page = await db.page.findFirst({
				include: pageIncludes,
				where: {
					id: req.params.pageId,
				},
			});

			if (!page) {
				return <LayoutElementError elementName="pages-form" id={element.id} />;
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
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Title</legend>
							<input
								type="text"
								placeholder="Page Title..."
								class="input input-xl"
								name="title"
								value={page?.title || ""}
								required
							/>
						</fieldset>

						{/* Description input */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Description</legend>
							<input
								type="text"
								placeholder="Page Description..."
								class="input input-md"
								name="description"
								value={page?.description || ""}
							/>
							<p class="label">Optional</p>
						</fieldset>

						{/* URL input */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">URL</legend>
							<input
								type="text"
								placeholder="/page-url"
								class="input input-md"
								name="url"
								value={page?.url || ""}
								required
							/>
							<p class="label">Must start with /</p>
						</fieldset>

						{/* Feature select */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Feature</legend>
							<select class="select select-md" name="assignedFeature">
								<option value="">None</option>
								{features.map((feature) => (
									<option value={feature} selected={page?.assignedFeature === feature}>
										{feature}
									</option>
								))}
							</select>
							<p class="label">Optional - assign this page to a feature</p>
						</fieldset>

						{/* Layout selection */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Layout</legend>
							<button
								type="button"
								id="select-layout-btn"
								class="btn btn-md btn-outline"
								data-layout-name={page?.layout?.title || ""}
							>
								<i class="w-4 h-4" data-lucide="layout"></i>
								<span id="selected-layout-text">{page?.layout?.title || "Select a layout..."}</span>
							</button>
							<p class="label">Required</p>
						</fieldset>

						{/* Is Active toggle */}
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Active</legend>
							<label class="label cursor-pointer justify-start gap-4">
								<input
									type="checkbox"
									class="toggle toggle-primary"
									name="isActive"
									checked={page?.isActive ?? true}
								/>
								<span class="label-text">Page is active and visible</span>
							</label>
						</fieldset>
					</div>
				</div>

				{/* Action buttons */}
				<div class="flex flex-row w-full justify-end gap-4">
					<button type="submit" class="btn btn-lg btn-primary">
						<i class="w-4 h-4" data-lucide="save"></i>
						Save
					</button>
					<button
						type="button"
						class="btn btn-lg btn-error"
						id="delete-page-btn"
						disabled={page?.isLocked ?? false}
					>
						<i class="w-4 h-4" data-lucide="trash"></i>
						Delete
					</button>
				</div>

				{/* Layout selection modal */}
				<dialog id="layout-selection-modal" class="modal">
					<div class="modal-box max-w-4xl">
						<h3 class="font-bold text-lg">Select Layout</h3>
						<div class="py-4 flex flex-col gap-4">
							{/* Search input */}
							<input
								type="text"
								placeholder="Search layouts..."
								class="input input-md"
								id="layout-search-input"
							/>
							{/* Layouts list */}
							<div class="flex flex-col gap-4 max-h-96 overflow-y-auto" id="layouts-list">
								{allLayouts.map((layout) => (
									<div
										class="card bg-base-100 shadow-sm layout-item"
										data-layout-id={layout.id}
										data-layout-title={layout.title}
										data-layout-description={layout.description}
									>
										<div class="card-body">
											<H2 className="card-title">{layout.title}</H2>
											<div class="flex flex-row gap-4">
												{layout.pages.map((p) => (
													<div class="badge badge-ghost">{p.url}</div>
												))}
											</div>
											<p>{layout.description}</p>
											<small>{layout.createdAt.toLocaleDateString()}</small>
											<div class="card-actions justify-end">
												<button
													type="button"
													class="btn btn-primary btn-sm select-layout-btn"
													data-layout-id={layout.id}
													data-layout-title={layout.title}
												>
													<i class="w-4 h-4" data-lucide="check"></i>
													Select
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
						<div class="modal-action">
							<button type="button" class="btn" id="cancel-layout-selection-btn">
								Cancel
							</button>
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
		const isEditMode = req.params.pageId && req.params.pageId !== "new";

		let page: PageData | null = null;
		if (isEditMode) {
			page = await db.page.findFirst({
				include: pageIncludes,
				where: {
					id: req.params.pageId,
				},
			});
		}

		const allLayouts = await db.layout.findMany({
			include: layoutIncludes,
		});

		const features = Object.values(Feature);

		return {
			page,
			allLayouts,
			features,
		} satisfies PagesFormData;
	},
	actionSchema: pagesFormActionSchema as any,
	action: async ({ element, data, request }) => {
		const { pageId, title, description, url, layoutId, isActive, assignedFeature, method } = data;

		// Get user from session
		const user = request.auth?.user;
		if (!user) {
			throw new Error("User not authenticated");
		}

		if (method === "DELETE") {
			if (!pageId) {
				throw new Error("Page ID is required to delete a page");
			}
			const page = await db.page.findUnique({
				where: { id: pageId },
			});
			if (!page) {
				throw new Error("Page not found");
			}
			if (page.isLocked) {
				throw new Error("Cannot delete a locked page");
			}
			await db.page.delete({ where: { id: pageId } });
			await reloadPages();
			return actionRedirect({ url: `/admin/pages`, message: "Page deleted successfully" });
		}

		// Validate URL starts with /
		if (!url.startsWith("/")) {
			throw new Error("URL must start with /");
		}

		// Check if layout exists
		const layout = await db.layout.findUnique({
			where: { id: layoutId },
		});
		if (!layout) {
			throw new Error("Layout not found");
		}

		// If updating, check if page exists
		if (pageId) {
			const existingPage = await db.page.findUnique({
				where: { id: pageId },
			});
			if (!existingPage) {
				throw new Error("Page not found");
			}

			// Check if URL is already taken by another page
			const urlTaken = await db.page.findFirst({
				where: {
					url,
					id: { not: pageId },
				},
			});
			if (urlTaken) {
				throw new Error("URL is already taken by another page");
			}

			await db.page.update({
				where: { id: pageId },
				data: {
					title,
					description,
					url,
					layoutId,
					isActive,
					assignedFeature: assignedFeature as Feature | null,
					updatedById: user.id,
					updatedAt: new Date(),
				},
			});

			await reloadPages();
			return actionRedirect({ url: `/admin/pages`, message: "Page updated successfully" });
		} else {
			// Check if URL is already taken
			const urlTaken = await db.page.findUnique({
				where: { url },
			});
			if (urlTaken) {
				throw new Error("URL is already taken");
			}

			await db.page.create({
				data: {
					title,
					description,
					url,
					layoutId,
					isActive,
					assignedFeature: assignedFeature as Feature | null,
					isLocked: false,
					createdById: user.id,
					updatedById: user.id,
				},
			});

			await reloadPages();
			return actionRedirect({ url: `/admin/pages`, message: "Page created successfully" });
		}
	},
};
