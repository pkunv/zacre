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
			[parameter.key.replace(`${layoutModule.module.shortName}.`, "")]: sanitizeParameterValue(
				parameter.value,
			),
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

/**
 * Sanitizes parameter values to prevent XSS attacks
 * Escapes HTML entities and removes potentially dangerous patterns
 */
export function sanitizeParameterValue(value: string) {
	if (!value || typeof value !== "string") {
		return "";
	}

	// First pass: Escape HTML entities
	let sanitized = value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");

	// Second pass: Remove null bytes and other dangerous characters
	sanitized = sanitized.replace(/\0/g, "");

	// Third pass: Remove javascript: and data: URI schemes (case-insensitive)
	sanitized = sanitized.replace(/javascript:/gi, "");
	sanitized = sanitized.replace(/data:text\/html/gi, "");
	sanitized = sanitized.replace(/vbscript:/gi, "");

	// Fourth pass: Remove on* event handlers (onclick, onload, etc.)
	sanitized = sanitized.replace(/on\w+\s*=/gi, "");

	return sanitized;
}

/**
 * Sanitizes HTML content while allowing safe tags
 * Use this for rich text content where some HTML is needed
 */
export function sanitizeHtmlContent(
	html: string,
	allowedTags: string[] = ["b", "i", "u", "p", "br", "strong", "em"],
) {
	if (!html || typeof html !== "string") {
		return "";
	}

	// Remove script tags and their content
	let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

	// Remove style tags and their content
	sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

	// Remove iframe tags
	sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");

	// Remove object and embed tags
	sanitized = sanitized.replace(/<(object|embed)[^>]*>.*?<\/\1>/gi, "");

	// Remove all event handlers
	sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
	sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

	// Remove javascript: and data: protocols from href and src attributes
	sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*javascript:/gi, "$1=");
	sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*data:text\/html/gi, "$1=");
	sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*vbscript:/gi, "$1=");

	// If specific tags are allowed, strip all other tags
	if (allowedTags.length > 0) {
		const tagPattern = allowedTags.join("|");
		const regex = new RegExp(`<(?!\\/?(${tagPattern})\\b)[^>]*>`, "gi");
		sanitized = sanitized.replace(regex, "");
	}

	return sanitized;
}
