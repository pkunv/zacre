import { LayoutElement } from "@/lib/server/layout";
import { serverFooter } from "@/modules/footer/server-footer";
import { serverHero } from "@/modules/hero/server-hero";
import { serverNavbar } from "@/modules/navbar/server-navbar";
import { VNode } from "preact";

// Define a parameter definition type
export type ParameterDefinition<T extends string> = {
	key: T;
	required?: boolean;
	defaultValue?: string;
};

// Helper type to extract parameter keys from parameter definitions
type ExtractParameterKeys<T> = T extends readonly ParameterDefinition<infer K>[] ? K : never;

export type ServerModule<TParams extends readonly ParameterDefinition<string>[]> = {
	shortName: string;
	name: string;
	description: string;
	parameters: TParams;
	createdAt: Date;
	loader: (element: LayoutElement<{ key: ExtractParameterKeys<TParams> }>) => VNode; // initial "Suspense" HTML
	data?: (element: LayoutElement<{ key: ExtractParameterKeys<TParams> }>) => Promise<any>;
};

export const serverModules = [serverHero, serverNavbar, serverFooter];
