import { Button } from "@/components/modules-ui/button";
import { Card, CardBody, CardTitle } from "@/components/modules-ui/card";
import { Input } from "@/components/modules-ui/input";
import { LayoutCard } from "@/components/modules-ui/layout-card";
import { H1 } from "@/components/modules-ui/typography";
import { getLayouts } from "@/lib/server/layouts/get";
import { tryCatch } from "@/lib/server/utils";
import { ParameterDefinition, ServerModule } from "@/modules/server";

export const adminLayoutsParameters = [] as const satisfies readonly ParameterDefinition<string>[];

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
				<Card className="w-full max-w-3xl">
					<CardBody>
						<CardTitle>Filters</CardTitle>
						<Input
							label="Search"
							icon="search"
							sizeOption="md"
							className="w-full"
							id="search-input"
							name="q"
							placeholder="Search by title, description, modules..."
						/>
					</CardBody>
				</Card>
				<div class="skeleton w-full max-w-3xl min-h-96"></div>
			</div>
		);
	},
	render: async ({ element, req }) => {
		const { data, error } = await tryCatch(
			getLayouts({
				page: req.data.query.page ? parseInt(req.data.query.page) : undefined,
				limit: req.data.query.limit ? parseInt(req.data.query.limit) : undefined,
				title: req.data.query.q,
				description: req.data.query.q,
				modules: req.data.query.q ? [{ shortName: req.data.query.q }] : undefined,
				orderBy: {
					title: req.data.query.orderBy === "title" ? "asc" : "desc",
					createdAt: req.data.query.orderBy === "createdAt" ? "asc" : "desc",
					updatedAt: req.data.query.orderBy === "updatedAt" ? "asc" : "desc",
				},
			}),
		);
		if (error) {
			throw new Error(error.message);
		}
		const layouts = data.items;

		return (
			<div class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4 justify-start">
				<div class="flex flex-row gap-4 justify-start">
					<H1 className="text-left">Layouts</H1>
					<Button
						sizeOption="md"
						className="btn-primary"
						iconName="plus"
						asLink
						href="/admin/layouts/new"
					>
						Create layout
					</Button>
				</div>
				<Card className="w-full max-w-3xl">
					<CardBody>
						<CardTitle>Filters</CardTitle>
						<Input
							label="Search"
							icon="search"
							className="w-full"
							id="search-input"
							name="q"
							placeholder="Search by title, description, modules..."
						/>
					</CardBody>
				</Card>
				<div class="flex flex-col gap-4 layouts-container w-full max-w-3xl min-h-96 h-full">
					{layouts.map((layout) => (
						<LayoutCard layout={layout} />
					))}
				</div>
			</div>
		);
	},
};
