import { Muted } from "@/components/modules-ui/typography";
import { configParameterCache } from "@/lib/server/parameter";
import { ParameterDefinition, ServerModule } from "@/modules/server";
import pkg from "../../../package.json";

export const adminSidebarParameters = [
	{ key: "isAlwaysVisible" },
] as const satisfies readonly ParameterDefinition<string>[];

export type AdminSidebarData = {
	modulesCount: number;
};

export const serverAdminSidebar: ServerModule<typeof adminSidebarParameters, unknown> = {
	shortName: "admin-sidebar",
	name: "Admin sidebar",
	description: "Module that allows to authorize and access client panel, admin panel and more.",
	createdAt: new Date("2025-09-19"),
	render: async ({ element }) => {
		return (
			<div class="w-full max-w-80 h-dvh bg-base-100 drawer lg:drawer-open">
				<input id="admin-sidebar-drawer" type="checkbox" class="drawer-toggle" />
				<div class="drawer-content flex md:hidden flex-col items-center justify-center">
					<label for="admin-sidebar-drawer" class="btn btn-primary drawer-button lg:hidden">
						Open sidebar
					</label>
				</div>
				<div class="drawer-side">
					<label
						for="admin-sidebar-drawer"
						aria-label="close sidebar"
						class="drawer-overlay"
					></label>
					<ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4 gap-4">
						<a href="/">
							<img
								src={configParameterCache.get("website.logo")?.value}
								alt="Logo"
								class="w-full h-fit object-scale-down max-w-48"
							/>
						</a>
						<li>
							<a href="/admin/pages">Pages</a>
						</li>
						<li>
							<a href="/admin/layouts">Layouts</a>
						</li>
						<li>
							<a id="sign-out-link">Sign Out</a>
						</li>
						<Muted className="flex-1 text-left justify-center align-center">
							Zacre v{pkg.version}
						</Muted>
					</ul>
				</div>
			</div>
		);
	},
};
