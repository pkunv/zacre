import { H2 } from "@/components/modules-ui/typography";
import { LayoutElementError } from "@/components/ui/error";
import { db } from "@/lib/server/db";
import { Layout, layoutIncludes } from "@/lib/server/layout";
import { ParameterDefinition, ServerModule } from "@/modules/server";
import { ParameterTypeEnum } from "~/generated/prisma/client";

export const layoutFormParameters = [] as const satisfies readonly ParameterDefinition<string>[];

export type LayoutFormData = {
	layout: Layout;
};

export const serverLayoutForm: ServerModule<typeof layoutFormParameters, unknown> = {
	shortName: "layout-form",
	name: "Layout form",
	description: "Module that allows to create and edit a layout.",
	createdAt: new Date("2025-09-22"),
	loader: ({ element }) => {
		return (
			<form class="w-full h-full" data-module="layout-form" data-element-id={element.id}>
				<input type="text" placeholder="Title..." class="input input-xl skeleton" name="title" />
				<input
					type="text"
					placeholder="Description..."
					class="input input-md skeleton"
					name="description"
				/>
				<div class="flex flex-col gap-4 skeleton min-w-full min-h-96"></div>
			</form>
		);
	},
	render: async ({ element, req }) => {
		const layout = await db.layout.findFirst({
			include: layoutIncludes,
			where: {
				id: req.params.parameter,
			},
		});

		if (!layout) {
			return <LayoutElementError elementName="layout-form" id={element.id} />;
		}

		return (
			<form
				class="w-full h-dvh overflow-auto p-4 flex flex-col gap-4 "
				data-module="layout-form"
				data-element-id={element.id}
			>
				<input
					type="text"
					placeholder="Title..."
					class="input input-xl"
					name="title"
					value={layout?.title}
				/>
				<input
					type="text"
					placeholder="Description..."
					class="input input-md"
					name="description"
					value={layout?.description}
				/>
				<div class="flex flex-col min-w-full min-h-96 card bg-base-100">
					{layout.modules.map((layoutModule) => (
						<div class="flex-col gap-4 card-body" key={layoutModule.id}>
							<div class="flex flex-row gap-4 w-full justify-between">
								<div class="flex flex-row gap-4">
									<H2 className="skeleton w-24 h-8">{layoutModule.module.name}</H2>
									<label for={`${layoutModule.id}.x`} class="input">
										<span class="label">X</span>
										<input
											type="number"
											name={`${layoutModule.id}.x`}
											value={layoutModule.x}
											class="w-12 text-left input input-sm hidden-arrows"
											readOnly
										/>
									</label>
									<label for={`${layoutModule.id}.y`} class="input">
										<span class="label">Y</span>
										<input
											type="number"
											name={`${layoutModule.id}.y`}
											value={layoutModule.y}
											class="w-12 text-left input input-sm hidden-arrows"
											readOnly
										/>
									</label>
								</div>
								<button class="btn btn-sm btn-error">
									<i class="w-4 h-4" data-lucide="trash"></i>
								</button>
							</div>
							<div class="flex flex-col gap-4">
								{layoutModule.parameters.map((parameter) => (
									<div class="flex flex-row gap-4">
										<label for={`${layoutModule.id}.${parameter.key}`} class="input">
											<span class="label">{parameter.parameter.key}</span>
											<input
												type={
													parameter.parameter.type === ParameterTypeEnum.STRING
														? "text"
														: parameter.parameter.type === ParameterTypeEnum.NUMBER
															? "number"
															: "text"
												}
												name={`${layoutModule.id}.${parameter.key}`}
												value={parameter.value}
												class="w-32 input input-sm"
											/>
										</label>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</form>
		);
	},
};
