import { pages } from "@/index";
import { ParameterDefinition, ServerModule } from "@/modules/server";
import { Feature } from "~/generated/prisma/client";

// Define the hero parameters as const for type safety
export const footerParameters = [
	{ key: "copyrightText" },
	{ key: "image" },
	{ key: "youtubeLink" },
	{ key: "facebookLink" },
	{ key: "instagramLink" },
	{ key: "xLink" },
	{ key: "linkedinLink" },
	{ key: "githubLink" },
	{ key: "emailAddress" },
	{ key: "phoneNumber" },
] as const satisfies readonly ParameterDefinition<string>[];

export const serverFooter: ServerModule<typeof footerParameters> = {
	shortName: "footer",
	name: "Footer",
	description:
		"Copyright text and site map with extensions like social media links and Openstreetmap location of your business.",
	parameters: footerParameters,
	createdAt: new Date("2025-09-14"),
	render: async ({ element }) => {
		const copyrightText = element.parameters.copyrightText;
		const image = element.parameters.image;

		const links = [
			{
				icon: "facebook",
				link: element.parameters.facebookLink,
			},
			{
				icon: "instagram",
				link: element.parameters.instagramLink,
			},
			{
				icon: "x",
				link: element.parameters.xLink,
			},
			{
				icon: "linkedin",
				link: element.parameters.linkedinLink,
			},
			{
				icon: "github",
				link: element.parameters.githubLink,
			},
			{
				icon: "at-sign",
				link: `mailto:${element.parameters.emailAddress}`,
			},
			{
				icon: "phone",
				link: element.parameters.phoneNumber,
			},
		];

		return (
			<footer class="footer sm:footer-horizontal bg-base-200 text-base-content p-8 h-[90dvh] md:px-24">
				<aside>
					{image && (
						<img src={image} alt="Footer image" class="w-full h-fit object-scale-down max-w-48" />
					)}
					<p>
						{copyrightText && copyrightText}
						<br />
						Built with Zacre
					</p>
				</aside>

				<nav>
					<h6 class="footer-title">Pages</h6>
					{pages
						.filter(
							(page) => page.assignedFeature === null || page.assignedFeature === Feature.AUTH,
						)
						.map((page) => (
							<a href={page.url} class="link link-hover">
								{page.title}
							</a>
						))}
				</nav>

				<nav>
					<h6 class="footer-title">Contact</h6>
					<div class="grid grid-flow-col gap-4">
						{links
							.filter((link) => link.link !== undefined)
							.map((link) => (
								<a href={link.link} target="_blank">
									<i data-lucide={link.icon} class="w-8 h-8" />
								</a>
							))}
					</div>
				</nav>
			</footer>
		);
	},
};
