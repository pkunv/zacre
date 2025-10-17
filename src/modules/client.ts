import { clientAdminSidebar } from "@/modules/admin-sidebar/client-admin-sidebar";
import { clientFooter } from "@/modules/footer/client-footer";
import { clientLayoutForm } from "@/modules/layout-form/client-layout-form";
import { clientNavbar } from "@/modules/navbar/client-navbar";
import { clientPageForm } from "@/modules/page-form/client-page-form";
import { clientSignIn } from "@/modules/sign-in/client-sign-in";

export type ClientModule<T> = {
	shortName: string;
	intervalPoll?: number; // in milliseconds
	hasNoServerData?: boolean;
	clientInit: ({ data, element }: { data: T; element: HTMLElement }) => Promise<void>;
	clientInterval?: ({ data, element }: { data: T; element: HTMLElement }) => void;
};

export const clientModules: ClientModule<any>[] = [
	clientNavbar,
	clientFooter,
	clientSignIn,
	clientAdminSidebar,
	clientLayoutForm,
	clientPageForm,
];
