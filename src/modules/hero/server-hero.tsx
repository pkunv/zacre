import { H1, H3 } from "@/components/modules-ui/typography";
import { LayoutElementError } from "@/components/ui/error";
import { db } from "@/lib/server/db";
import { ParameterDefinition, ServerModule } from "@/modules/server";

// Define the hero parameters as const for type safety
export const heroParameters = [
	{ key: "title" },
	{ key: "description" },
	{ key: "image" },
	{ key: "primaryButtonText" },
	{ key: "primaryButtonLink" },
	{ key: "secondaryButtonText" },
	{ key: "secondaryButtonLink" },
	{ key: "viewType" },
] as const satisfies readonly ParameterDefinition<string>[];

export type HeroData = {
	modulesCount: number;
};

export const serverHero: ServerModule<typeof heroParameters> = {
	shortName: "hero",
	name: "Hero",
	description: "Hero banner, great for highlighting the main message of the website.",
	parameters: heroParameters,
	createdAt: new Date("2025-09-10"),
	loader: (element) => {
		if (!element.parameters.title) {
			return <LayoutElementError elementName="hero" id={element.id} />;
		}
		const title = element.parameters.title;
		const description = element.parameters.description;
		const primaryButtonText = element.parameters.primaryButtonText;
		const primaryButtonLink = element.parameters.primaryButtonLink;
		const secondaryButtonText = element.parameters.secondaryButtonText;
		const secondaryButtonLink = element.parameters.secondaryButtonLink;
		const image = element.parameters.image;

		return (
			<div
				class="w-full h-dvh bg-base-100 flex flex-col md:flex-row justify-center items-center gap-4"
				data-module="hero"
				data-element-id={element.id}
			>
				{image && (
					<img src={image} alt={title} class="w-1/2 max-w-sm h-auto md:h-full object-scale-down" />
				)}
				{image && (
					<img
						src={image}
						alt={title}
						class="w-1/2 max-w-sm h-auto md:h-full object-scale-down absolute blur-3xl left-1/4"
					/>
				)}
				<div class="w-1/2 h-auto md:h-full flex flex-col justify-center items-center gap-4">
					<H1>{title}</H1>
					{description && <H3>{description}</H3>}
					<div class="flex justify-center items-center gap-4">
						{primaryButtonText && primaryButtonLink && (
							<a href={primaryButtonLink} class="btn btn-xl btn-primary">
								{primaryButtonText}
							</a>
						)}
						{secondaryButtonText && secondaryButtonLink && (
							<a href={secondaryButtonLink} class="btn btn-xl btn-outline">
								{secondaryButtonText}
							</a>
						)}
					</div>
					<div class="text-sm text-gray-500 flex items-center gap-2">
						<div class="modules-count skeleton h-4 w-4"></div> components available!
					</div>
				</div>
			</div>
		);
	},
	data: async () => {
		const modulesCount = await db.module.count();

		return { modulesCount };
	},
};
