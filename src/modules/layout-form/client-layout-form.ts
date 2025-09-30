import { ClientModule } from "@/modules/client";
import { LayoutFormData } from "@/modules/layout-form/server-layout-form";

export const clientLayoutForm: ClientModule<LayoutFormData> = {
	shortName: "layout-form",
	clientInit: async ({ data, element }) => {
		const skeletonElements = element.querySelectorAll(".skeleton");
		skeletonElements.forEach((element) => {
			element.classList.remove("skeleton");
		});
		const titleInput = element.querySelector("input[name='title']") as HTMLInputElement;
		const descriptionInput = element.querySelector("input[name='description']") as HTMLInputElement;
		if (titleInput) {
			titleInput.value = data.layout.title;
		}
		if (descriptionInput) {
			descriptionInput.value = data.layout.description;
		}
		const modulesContainer = element.querySelector(".modules-container") as HTMLDivElement;
		const layoutModuleTemplate = element.querySelector("#layout-module-template") as HTMLDivElement;
	},
};
