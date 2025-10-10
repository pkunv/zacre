import { H1, H2, P } from "@/components/modules-ui/typography";
import { db } from "@/lib/server/db";
import { Layout, layoutIncludes } from "@/lib/server/layout";
import { ParameterDefinition, ServerModule } from "@/modules/server";

export const adminLayoutsParameters = [] as const satisfies readonly ParameterDefinition<string>[];

export type AdminLayoutsData = {
	layouts: Layout[];
};

export const serverAdminLayouts: ServerModule<typeof adminLayoutsParameters, unknown> = {
	shortName: "admin-layouts",
	name: "Admin layouts",
	description: "Module that allows to manage layouts.",
	createdAt: new Date("2025-09-19"),
	loader: ({ element }) => {
		return (
			<div class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4 justify-start">
				<div class="flex flex-row gap-4 justify-start">
					<H1 className="text-left">Layouts</H1>
					<a className="btn btn-primary" href="/admin/layouts/new">
						<i class="w-4 h-4" data-lucide="plus"></i>Create layout
					</a>
				</div>
				<div class="flex flex-col gap-4 layouts-container skeleton w-full max-w-3xl min-h-96 h-full"></div>
			</div>
		);
	},
	render: async ({ element }) => {
		const layouts = await db.layout.findMany({
			include: layoutIncludes,
		});

		return (
			<div class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4 justify-start">
				<div class="flex flex-row gap-4 justify-start">
					<H1 className="text-left">Layouts</H1>
					<a className="btn btn-primary" href="/admin/layouts/new">
						<i class="w-4 h-4" data-lucide="plus"></i>Create layout
					</a>
				</div>
				<div class="flex flex-col gap-4 layouts-container w-full max-w-3xl min-h-96 h-full">
					{layouts.map((layout) => (
						<div class="flex flex-col gap-4 card bg-base-100 shadow-sm w-full max-w-3xl">
							<div class="card-body">
								<H2 className="card-title">{layout.title}</H2>
								<div class="flex flex-row gap-4">
									{layout.pages.map((page) => (
										<div class="badge badge-ghost">{page.url}</div>
									))}
								</div>
								<P>{layout.description}</P>
								<small>{layout.createdAt.toLocaleDateString()}</small>
								<div class="card-actions justify-end">
									<a className="btn btn-primary btn-edit" href={`/admin/layouts/${layout.id}`}>
										<i class="w-4 h-4" data-lucide="pencil"></i>Edit
									</a>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	},
};
