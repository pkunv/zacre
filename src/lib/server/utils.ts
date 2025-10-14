import { env } from "@/lib/server/env";
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
