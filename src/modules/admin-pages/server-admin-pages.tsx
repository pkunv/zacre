import { Button } from "@/components/modules-ui/button";
import { PageCard } from "@/components/modules-ui/page-card";
import { H1 } from "@/components/modules-ui/typography";
import { db } from "@/lib/server/db";
import { Page, pageIncludes } from "@/lib/server/pages/get";
import { ParameterDefinition, ServerModule } from "@/modules/server";

export const adminPagesParameters = [] as const satisfies readonly ParameterDefinition<string>[];

export type AdminPagesData = {
	pages: Page[];
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
					<Button iconName="plus" asLink href="/admin/pages/new">
						Create page
					</Button>
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
					<Button iconName="plus" asLink href="/admin/pages/new">
						Create page
					</Button>
				</div>
				<div class="flex flex-col gap-4 pages-container w-full max-w-3xl min-h-96 h-full">
					{pages.map((page) => (
						<PageCard page={page} />
					))}
				</div>
			</div>
		);
	},
};
