import { layoutModulesRouter } from "@/api/layout-modules";
import { auth, Session } from "@/auth";
import { authMiddleware } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { logMessage, serverLog } from "@/lib/server/log";
import { getPage, pageIncludes, RawPage, renderPage } from "@/lib/server/page";
import { createMiddleware, RouterRequest } from "@/lib/server/typed-router";
import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import express, { Request, RequestHandler, Response } from "ultimate-express";

export const app = express();

app.use(serverLog as unknown as RequestHandler);
app.use(compression() as unknown as RequestHandler);
app.use((req, res, next) => {
	res.setHeader(
		"Content-Security-Policy",
		"default-src 'self'; script-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';",
	);
	next();
});
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.static(path.join(process.cwd(), "public")));
app.use(
	cors({
		origin: `http://localhost`, // Replace with your frontend's origin
		methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
		credentials: true, // Allow credentials (cookies, authorization headers, etc.)
	}),
);

export let pages: RawPage[] = await db.page.findMany({
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
		app.get(
			page.url,
			// @ts-ignore
			(req: Request & { auth: Session | null }, res: Response, next: NextFunction) => {
				authMiddleware(req, res, next, page.role || undefined);
			},
			// @ts-ignore
			async (req: RouterRequest, res) => {
				const perf = performance.now();

				const url = page.url;
				const pageData = await getPage({ url: url, req });
				const html = await renderPage(pageData, req as RouterRequest);
				logMessage({
					functionName: "renderPage",
					message: `Rendering page ${url} in ${performance.now() - perf}ms`,
				});
				res.setHeader("Content-Type", "text/html");
				res.send(html);
				return;
			},
		);
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

app.post("/api/layout-modules/:elementId", ...createMiddleware(layoutModulesRouter.action));

app.get("/api/layout-modules/:elementId", ...createMiddleware(layoutModulesRouter.render));

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
