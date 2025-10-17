import { env } from "@/lib/server/env";
import { Page } from "@/lib/server/pages/get";
import { RouterRequest } from "@/lib/server/typed-router";
import crypto, { BinaryToTextEncoding } from "crypto";
import { readdirSync } from "fs";
import path from "path";

export let clientBundleFilename: string | null = null;

export function getClientBundleFilename() {
	if (clientBundleFilename && env.NODE_ENV === "production") return clientBundleFilename;
	const publicDir = path.join(process.cwd(), "public");
	const files = readdirSync(publicDir);
	const mainJs = files.find((f: string) => /^main-[\w\d]+\.js$/.test(f));
	if (!mainJs) throw new Error("main-[hash].js not found in /public");
	clientBundleFilename = mainJs;
	return mainJs;
}

export function generateChecksum(str: string, algorithm: string, encoding: string) {
	return crypto
		.createHash(algorithm || "md5")
		.update(str, "utf8")
		.digest((encoding as BinaryToTextEncoding) || "hex");
}

// Types for the result object with discriminated union
type Success<T> = {
	data: T;
	error: null;
};

type Failure<E> = {
	data: null;
	error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}

export type PaginatedResponse<T> = {
	currentPage: number;
	filters: null;
	totalPages: number;
	totalItems: number;
	perPage: number;
	items: T[];
};

export function getRefererRequestParams({ req, pageUrl }: { req: RouterRequest; pageUrl: string }) {
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

export function getRefererRequestSearchQueryParams({
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

	// Extract search query parameters
	const refererUrl = new URL(referer);
	const searchParams = refererUrl.searchParams;

	return Object.fromEntries(searchParams);
}

export function formatDate(date: Date) {
	// TODO: website parameter "language" for date formatting
	return date.toLocaleDateString("pl-PL");
}

export function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function findPageByUrl(pages: Page[], fullUrl: string) {
	// Extract pathname from full URL
	let pathname: string;
	try {
		const urlObj = new URL(fullUrl);
		pathname = urlObj.pathname;
	} catch {
		// If it's not a full URL, assume it's already a pathname
		pathname = fullUrl;
	}

	// Normalize pathname (remove trailing slash if present, except for root)
	if (pathname !== "/" && pathname.endsWith("/")) {
		pathname = pathname.slice(0, -1);
	}

	// Split pathname into segments
	const pathnameSegments = pathname.split("/").filter((segment) => segment !== "");

	// First pass: look for exact matches (static routes)
	const exactMatch = pages.find((page: any) => {
		let pageUrl = page.url;
		if (pageUrl !== "/" && pageUrl.endsWith("/")) {
			pageUrl = pageUrl.slice(0, -1);
		}
		return pageUrl === pathname;
	});

	if (exactMatch) {
		return exactMatch;
	}

	// Second pass: look for parametrized matches
	for (const page of pages) {
		let pageUrl = page.url;
		if (pageUrl !== "/" && pageUrl.endsWith("/")) {
			pageUrl = pageUrl.slice(0, -1);
		}

		const pageSegments = pageUrl.split("/").filter((segment: string) => segment !== "");

		// Check if the paths have the same number of segments
		if (pathnameSegments.length !== pageSegments.length) {
			continue;
		}

		// Check if all segments match (treating :param as a wildcard)
		let isMatch = true;
		for (let i = 0; i < pageSegments.length; i++) {
			const pageSegment = pageSegments[i];
			const pathnameSegment = pathnameSegments[i];

			// If the page segment starts with ':', it's a parameter (matches anything)
			if (pageSegment.startsWith(":")) {
				continue;
			}

			// Otherwise, segments must match exactly
			if (pageSegment !== pathnameSegment) {
				isMatch = false;
				break;
			}
		}

		if (isMatch) {
			return page;
		}
	}

	// No match found
	return null;
}
