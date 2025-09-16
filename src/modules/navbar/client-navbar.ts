import { ClientModule } from "@/modules/client";
import { HeroData } from "@/modules/hero/server-hero";

export const clientNavbar: ClientModule<HeroData> = {
	shortName: "navbar",
	hasNoServerData: true,
	clientInit: ({ data, element }) => {
		const searchInput = element.querySelector("input[type='text']");
		if (searchInput) {
			searchInput.classList.remove("skeleton");
			searchInput.textContent = data.modulesCount.toString();
		}
	},
};
