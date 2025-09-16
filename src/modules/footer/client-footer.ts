import { ClientModule } from "@/modules/client";

export const clientFooter: ClientModule<unknown> = {
	shortName: "footer",
	hasNoServerData: true,
	clientInit: ({ data, element }) => {
		// Here will come Openstreetmap initialization
		console.log(element);
	},
};
