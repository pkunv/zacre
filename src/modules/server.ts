import { LayoutModuleElement } from "@/lib/server/layouts/get";
import { RouterRequest } from "@/lib/server/typed-router";
import { serverAdminLayouts } from "@/modules/admin-layouts/server-admin-layouts";
import { serverAdminPages } from "@/modules/admin-pages/server-admin-pages";
import { serverAdminSidebar } from "@/modules/admin-sidebar/server-admin-sidebar";
import { serverFooter } from "@/modules/footer/server-footer";
import { serverHero } from "@/modules/hero/server-hero";
import { serverLayoutForm } from "@/modules/layout-form/server-layout-form";
import { serverNavbar } from "@/modules/navbar/server-navbar";
import { serverPageForm } from "@/modules/page-form/server-page-form";
import { serverSignIn } from "@/modules/sign-in/server-sign-in";
import { VNode } from "preact";
import { ZodObject } from "zod/v3";
import { ParameterTypeEnum } from "~/generated/prisma/client";

// Define a parameter definition type
export type ParameterDefinition<T extends string> = {
	key: T;
	isRequired?: boolean;
	isSelect?: boolean;
	selectValues?: string[] | number[];
	type?: ParameterTypeEnum;
	schema?: string;
};

// Helper type to extract parameter keys from parameter definitions
export type ExtractParameterKeys<T> = T extends readonly ParameterDefinition<infer K>[] ? K : never;

export type ServerModule<
	TParams extends readonly ParameterDefinition<string>[],
	TRequestData = any,
> = {
	shortName: string;
	name: string;
	description: string;
	parameters?: TParams;
	createdAt: Date;
	loader?: ({
		req,
		element,
	}: {
		req: RouterRequest;
		element: LayoutModuleElement<{ key: ExtractParameterKeys<TParams> }>;
	}) => VNode; // initial "Suspense" HTML
	render?: ({
		element,
		req,
	}: {
		element: LayoutModuleElement<{ key: ExtractParameterKeys<TParams> }>;
		req: RouterRequest;
	}) => Promise<VNode>;
	data?: (
		element: LayoutModuleElement<{ key: ExtractParameterKeys<TParams> }>,
		req: RouterRequest,
	) => Promise<any>;
	actionSchema?: ZodObject<any>;
	action?: ({
		element,
		data,
		request,
	}: {
		element: LayoutModuleElement<{ key: ExtractParameterKeys<TParams> }>;
		data: TRequestData;
		request: RouterRequest;
	}) => Promise<any>;
};

export const serverModules = [
	serverHero,
	serverNavbar,
	serverFooter,
	serverSignIn,
	serverAdminSidebar,
	serverAdminLayouts,
	serverAdminPages,
	serverLayoutForm,
	serverPageForm,
];

export const throwActionError = ({
	statusCode,
	status,
	message,
}: {
	statusCode: number;
	status?: string;
	message: string;
}) => {
	throw { statusCode, status, body: { message } };
};

export type ModuleActionError = {
	statusCode: number;
	status?: string;
	body: { message: string };
};

export function actionRedirect({ url, message }: { url: string; message?: string }) {
	return {
		status: "redirect",
		message,
		url,
	};
}
