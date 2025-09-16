import { pages } from "@/index";
import { ParameterDefinition, ServerModule } from "@/modules/server";

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
	loader: (element) => {
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
			<footer
				class="footer sm:footer-horizontal bg-base-200 text-base-content p-8 h-dvh md:px-24"
				data-module="footer"
				data-element-id={element.id}
			>
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
				{pages.map((page) => (
					<nav>
						<h6 class="footer-title">Pages</h6>
						<a class="link link-hover">{page.title}</a>
					</nav>
				))}
				<nav>
					<h6 class="footer-title">Social</h6>
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
