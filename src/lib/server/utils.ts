import { env } from "@/lib/server/env";
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
