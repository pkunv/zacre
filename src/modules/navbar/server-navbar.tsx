import { pages } from "@/index";
import { ParameterDefinition, ServerModule } from "@/modules/server";

// Define the hero parameters as const for type safety
export const navbarParameters = [
	{ key: "titleImage" },
	{ key: "titleText" },
	{ key: "isSearchEnabled" },
] as const satisfies readonly ParameterDefinition<string>[];

export const serverNavbar: ServerModule<typeof navbarParameters> = {
	shortName: "navbar",
	name: "Navbar",
	description: "Main navigation bar - responsive and intuitive.",
	parameters: navbarParameters,
	createdAt: new Date("2025-09-14"),
	render: async ({ element }) => {
		const image = element.parameters.titleImage;
		const text = element.parameters.titleText;
		const isSearchEnabled = element.parameters.isSearchEnabled;
		return (
			<div class="navbar bg-base-200 fixed shadow-sm px-8 md:px-24 z-50">
				<div class="flex-1">
					{image && <img src={image} alt={text} class="w-full h-fit object-scale-down max-w-48" />}
					{text && <a class="btn btn-ghost text-xl">{text}</a>}
				</div>
				<div class="flex-none">
					{isSearchEnabled && (
						<input type="text" placeholder="Search everything..." class="input input-bordered" />
					)}
					<ul class="menu menu-horizontal px-1">
						{pages
							.filter((page) => page.assignedFeature === null)
							.map((page) => (
								<li class="hidden md:block">
									<a href={page.url}>{page.title}</a>
								</li>
							))}
						<li class="md:hidden">
							<details>
								<summary>Menu</summary>
								<ul class="bg-base-100 rounded-t-none p-2">
									{pages
										.filter((page) => page.assignedFeature === null)
										.map((page) => (
											<li>
												<a href={page.url}>{page.title}</a>
											</li>
										))}
								</ul>
							</details>
						</li>
					</ul>
				</div>
			</div>
		);
	},
};
