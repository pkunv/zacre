import { clientFooter } from "@/modules/footer/client-footer";
import { clientHero } from "@/modules/hero/client-hero";
import { clientNavbar } from "@/modules/navbar/client-navbar";

export type ClientModule<T> = {
	shortName: string;
	intervalPoll?: number; // in milliseconds
	hasNoServerData?: boolean;
	clientInit: ({ data, element }: { data: T; element: HTMLElement }) => void;
	clientInterval?: ({ data, element }: { data: T; element: HTMLElement }) => void;
};

export const clientModules: ClientModule<any>[] = [clientHero, clientNavbar, clientFooter];
