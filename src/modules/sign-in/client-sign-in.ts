import { authClient } from "@/client";
import { toast } from "@/lib/client/toast";
import { lockModuleButtons, unlockModuleButtons } from "@/lib/client/utils";
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
				const response = await authClient.signIn.email({
					email: formData.get("email") as string,
					password: formData.get("password") as string,
				});
				if (response.error) {
					toast.error(response.error.message || "An error occurred");
				} else {
					toast.success("Signed in successfully. You will be redirected to the home page.");
					setTimeout(() => {
						window.location.href = "/admin";
					}, 650);
				}
				unlockModuleButtons(element);
			};
		}
	},
};
