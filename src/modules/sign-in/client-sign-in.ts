import { authClient, executeModuleAction, lockModuleButtons, unlockModuleButtons } from "@/client";
import { ClientModule } from "@/modules/client";

export const clientSignIn: ClientModule<unknown> = {
	shortName: "sign-in",
	hasNoServerData: true,
	clientInit: async ({ data, element }) => {
		const form = element.querySelector("form");
		if (form) {
			form.onsubmit = async (e) => {
				e.preventDefault();
				const formData = new FormData(form);
				lockModuleButtons(element);
				await authClient.signIn.email({
					email: formData.get("email") as string,
					password: formData.get("password") as string,
				});
				await executeModuleAction({
					element,
					elementId: element.dataset.elementId!,
					lockButtons: false,
				});
				unlockModuleButtons(element);
			};
		}
	},
};
