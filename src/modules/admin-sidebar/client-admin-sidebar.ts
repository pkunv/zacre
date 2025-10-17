import { authClient } from "@/client";
import { toast } from "@/lib/client/toast";
import { AdminLayoutsData } from "@/modules/admin-layouts/server-admin-layouts";
import { ClientModule } from "@/modules/client";

export const clientAdminSidebar: ClientModule<AdminLayoutsData> = {
	shortName: "admin-sidebar",
	hasNoServerData: false,
	clientInit: async ({ data, element }) => {
		const signOutLink = element.querySelector("#sign-out-link") as HTMLAnchorElement;
		if (signOutLink) {
			signOutLink.onclick = async () => {
				await authClient.signOut({
					fetchOptions: {
						onSuccess: () => {
							toast.success("Signed out successfully. You will be redirected to the home page.");
							setTimeout(() => {
								window.location.href = "/";
							}, 650);
						},
					},
				});
			};
		}
	},
};
