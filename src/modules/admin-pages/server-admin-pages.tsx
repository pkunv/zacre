import { H1, H2, P } from "@/components/modules-ui/typography";
import { db } from "@/lib/server/db";
import { pageIncludes, RawPage } from "@/lib/server/page";
import { ParameterDefinition, ServerModule } from "@/modules/server";

export const adminPagesParameters = [] as const satisfies readonly ParameterDefinition<string>[];

export type AdminPagesData = {
	pages: RawPage[];
};

export const serverAdminPages: ServerModule<typeof adminPagesParameters, unknown> = {
	shortName: "admin-pages",
	name: "Admin pages",
	description: "Module that allows to manage pages.",
	createdAt: new Date("2025-10-10"),
	loader: ({ element }) => {
		return (
			<div class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4 justify-start">
				<div class="flex flex-row gap-4 justify-start">
					<H1 className="text-left">Pages</H1>
					<a className="btn btn-primary" href="/admin/pages/new">
						<i class="w-4 h-4" data-lucide="plus"></i>Create page
					</a>
				</div>
				<div class="flex flex-col gap-4 pages-container skeleton w-full max-w-3xl min-h-96 h-full"></div>
			</div>
		);
	},
	render: async ({ element }) => {
		const pages = await db.page.findMany({
			include: pageIncludes,
		});

		return (
			<div class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4 justify-start">
				<div class="flex flex-row gap-4 justify-start">
					<H1 className="text-left">Pages</H1>
					{/*}
					<a className="btn btn-primary" href="/admin/pages/new">
						<i class="w-4 h-4" data-lucide="plus"></i>Create page
					</a>
					*/}
				</div>
				<div class="flex flex-col gap-4 pages-container w-full max-w-3xl min-h-96 h-full">
					{pages.map((page) => (
						<div class="flex flex-col gap-4 card bg-base-100 shadow-sm w-full max-w-3xl">
							<div class="card-body">
								<a
									href={page.url}
									target="_blank"
									class="flex flex-row gap-4 items-center link-hover"
								>
									<H2 className="card-title">{page.title}</H2>
									<i data-lucide="external-link" class="w-3 h-3"></i>
								</a>
								<div class="flex flex-row gap-4 items-center">
									<div class="badge badge-primary">{page.url}</div>
									{page.assignedFeature && (
										<div class="badge badge-ghost">{page.assignedFeature}</div>
									)}
									{page.role && <div class="badge badge-secondary">Role: {page.role}</div>}
									{page.isLocked && <div class="badge badge-warning">Locked</div>}
								</div>
								<P>{page.description}</P>
								<small class="text-base-content/60">
									Layout: {page.layout.title} • Created {page.createdAt.toLocaleDateString()}
								</small>
								<div class="card-actions justify-end">
									<a className="btn btn-primary btn-edit" href={`/admin/pages/${page.id}`}>
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
