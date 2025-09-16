import { ClientModule } from "@/modules/client";
import { HeroData } from "@/modules/hero/server-hero";

export const clientHero: ClientModule<HeroData> = {
	shortName: "hero",
	clientInit: ({ data, element }) => {
		const modulesCount = element.querySelector(".modules-count");
		if (modulesCount) {
			modulesCount.classList.remove("skeleton");
			modulesCount.textContent = data.modulesCount.toString();
		}
	},
};
