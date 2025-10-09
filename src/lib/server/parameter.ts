import { Cache } from "@/lib/server/cache";
import { db } from "@/lib/server/db";
import { RawLayoutModule } from "@/lib/server/layout";
import { logMessage } from "@/lib/server/log";
import { RouterRequest } from "@/lib/server/typed-router";
import { ConfigParameter } from "~/generated/prisma/client";

export const parameterKeys = [
	"website.name",
	"website.description",
	"website.keywords",
	"website.author",
	"website.logo",
	"website.favicon",
	"website.theme",
] as const;

//serverModules.map((module) => module.parameters.map((parameter) => parameter.key)).flat(),

export type ParameterKeys = (typeof parameterKeys)[number];

// cached for 24 hours, will be invalidated after update
export const configParameterCache = new Cache<ConfigParameter>(24);

export const getConfigParameter = async (name: ParameterKeys) => {
	const cachedParameter = configParameterCache.get(name);
	if (cachedParameter) {
		return cachedParameter;
	}
	const parameter = await db.configParameter.findUnique({ where: { key: name } });
	if (parameter) {
		configParameterCache.set(name, parameter);
	}
	if (!parameter) {
		// TODO: Error handling messaging for the user
		throw new Error(
			logMessage({
				functionName: "getConfigParameter",
				message: `Parameter ${name} not found`,
			}).join(" "),
		);
	}
	return parameter;
};

export const getConfigParameters = async () => {
	const parameterPromises = parameterKeys.map(async (key) => ({
		key,
		parameter: await getConfigParameter(key),
	}));

	const parameterResults = await Promise.all(parameterPromises);

	const configParameters: Record<ParameterKeys, ConfigParameter> = parameterResults.reduce(
		(acc, { key, parameter }) => {
			acc[key] = parameter;
			return acc;
		},
		{} as Record<ParameterKeys, ConfigParameter>,
	);

	return configParameters;
};

export async function initializeParameters() {
	await Promise.all(
		parameterKeys.map(async (key) => {
			await db.parameterType.upsert({
				where: {
					key,
				},
				create: {
					key,
				},
				update: {},
			});
		}),
	);
}

export async function createConfigParameter(name: ParameterKeys, value: string) {
	await db.configParameter.upsert({
		where: { key: name },
		create: { key: name, value },
		update: {},
	});
}

export function getLayoutModuleParameters(layoutModule: RawLayoutModule) {
	const moduleParameters = layoutModule.parameters
		.map((parameter) => ({
			[parameter.key.replace(`${layoutModule.module.shortName}.`, "")]: parameter.value,
		}))
		.reduce(
			(acc, parameter) => {
				return { ...acc, ...parameter };
			},
			{} as Record<string, string>,
		);

	return moduleParameters;
}

export function getRefererRequestParameters({
	req,
	pageUrl,
}: {
	req: RouterRequest;
	pageUrl: string;
}) {
	const url = pageUrl;
	const referer = req.headers.referer;
	if (!referer) {
		return {};
	}

	// Extract pathname from referer URL
	const refererUrl = new URL(referer);
	const refererPath = refererUrl.pathname;

	// Split both paths into segments
	const refererSegments = refererPath.split("/").filter((segment) => segment !== "");
	const urlSegments = url.split("/").filter((segment) => segment !== "");

	// Check if the paths have the same number of segments
	if (refererSegments.length !== urlSegments.length) {
		return {};
	}

	// Extract parameters
	const parameters: Record<string, string> = {};

	for (let i = 0; i < urlSegments.length; i++) {
		const urlSegment = urlSegments[i];
		const refererSegment = refererSegments[i];

		// If the URL segment starts with ':', it's a parameter
		if (urlSegment.startsWith(":")) {
			const paramName = urlSegment.slice(1); // Remove the ':' prefix
			parameters[paramName] = refererSegment;
		} else if (urlSegment !== refererSegment) {
			// If segments don't match and it's not a parameter, paths don't match
			return {};
		}
	}

	return parameters;
}
