import { layoutModulesRouter } from "@/api/layout-modules";
import { auth } from "@/auth";
import { db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { logMessage, serverLog } from "@/lib/server/log";
import { getPage, pageIncludes, renderPage } from "@/lib/server/page";
import { createMiddleware, RouterRequest } from "@/lib/server/typed-router";
import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import fs from "fs/promises";
import path from "path";
import express, { RequestHandler } from "ultimate-express";

export const app = express();
app.use(compression() as unknown as RequestHandler);
app.all("/api/auth/*", toNodeHandler(auth));
app.use(serverLog as unknown as RequestHandler);
app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json());

export let pages = await db.page.findMany({
	include: pageIncludes,
});

async function mountPages() {
	logMessage({
		functionName: "mountPages",
		message: "Mounting pages",
	});
	pages = await db.page.findMany({
		include: pageIncludes,
	});
	const pagesMetadata: {
		[key: string]: {
			url: string;
			title: string;
			checksum: string;
			filename: string;
		};
	} = {};
	const zacreDir = path.join(process.cwd(), ".zacre");
	try {
		await fs.access(zacreDir);
	} catch {
		await fs.mkdir(zacreDir, { recursive: true });
	}
	for (const page of pages) {
		/*
		const pageData = await getPage(page.url);
		const html = await renderPage(pageData, {} as RouterRequest);
		const checksum = generateChecksum(page.url, "md5", "hex");
		const randomFilename = Math.random().toString(36).substring(2, 15);
		pagesMetadata[page.id] = {
			url: page.url,
			title: page.title,
			checksum,
			filename: `${randomFilename}.html`,
		};
		await fs.writeFile(path.join(zacreDir, `${randomFilename}.html`), html);
		*/
		app.get(page.url, async (req, res) => {
			const perf = performance.now();

			const url = req.url;
			const page = await getPage(url);
			logMessage({
				functionName: "getPage",
				message: `Getting page ${req.url} in ${performance.now() - perf}ms`,
			});
			const html = await renderPage(page, req as RouterRequest);
			logMessage({
				functionName: "renderPage",
				message: `Rendering page ${req.url} in ${performance.now() - perf}ms`,
			});
			res.setHeader("Content-Type", "text/html");
			res.send(html);
			return;
		});
		/*
		await fs.writeFile(
			path.join(zacreDir, "pages-metadata.json"),
			JSON.stringify(pagesMetadata, null, 2),
		);
		*/
	}
}

export async function reloadPages() {
	await mountPages();
}

mountPages();

app.get("/api/layout-modules", ...createMiddleware(layoutModulesRouter.getMany));

app.listen(env.PORT, () => {
	logMessage({
		functionName: "app.listen",
		message: `Server is running on port ${env.PORT}`,
	});
	console.log(`Launched ${pages.length} pages:`);
	for (const page of pages) {
		console.log(`${page.title}: ${page.url} - http://localhost:${env.PORT}${page.url}`);
	}
});
