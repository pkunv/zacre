import { Cache } from "@/lib/server/cache";
import { db } from "@/lib/server/db";
import { logMessage } from "@/lib/server/log";
import { ConfigParameter, LayoutModuleParameter } from "~/generated/prisma/client";

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

export async function createParameter(name: ParameterKeys, value: string) {
	await db.configParameter.upsert({
		where: { key: name },
		create: { key: name, value },
		update: {},
	});
}

export function getModuleParameters(parameters: LayoutModuleParameter[]) {
	const moduleParameters = parameters
		.map((parameter) => ({
			[parameter.key]: parameter.value,
		}))
		.reduce(
			(acc, parameter) => {
				return { ...acc, ...parameter };
			},
			{} as Record<string, string>,
		);

	return moduleParameters;
}
