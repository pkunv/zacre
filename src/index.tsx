import { layoutModulesRouter } from "@/api/layout-modules";
import { layoutsRouter } from "@/api/layouts";
import { pagesRouter } from "@/api/pages";
import { auth, Session } from "@/auth";
import { authMiddleware } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { logMessage, serverLog } from "@/lib/server/log";
import { assemblePage, Page, pageIncludes, renderPageToHTML } from "@/lib/server/pages/get";
import { createMiddleware, RouterRequest } from "@/lib/server/typed-router";
import { toNodeHandler } from "better-auth/node";
import compression from "compression";
import cors from "cors";
import path from "path";
import express, { Request, RequestHandler, Response } from "ultimate-express";

export const app = express();

app.use(serverLog as unknown as RequestHandler);
app.use(compression() as unknown as RequestHandler);

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.static(path.join(process.cwd(), "public")));
app.use(
	cors({
		origin: `http://localhost`, // Replace with your frontend's origin
		methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed HTTP methods
		credentials: true, // Allow credentials (cookies, authorization headers, etc.)
	}),
);

export let pages: Page[] = await db.page.findMany({
	include: pageIncludes,
	where: {
		isActive: true,
	},
});

async function mountPages() {
	logMessage({
		functionName: "mountPages",
		message: "Mounting pages",
	});
	pages = await db.page.findMany({
		include: pageIncludes,
		where: {
			isActive: true,
		},
	});
	for (const page of pages) {
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
				const pageData = await assemblePage({ url: url, req });
				const html = await renderPageToHTML(pageData, req as RouterRequest);
				logMessage({
					functionName: "assemblePage",
					message: `Assembled page ${url} in ${performance.now() - perf}ms`,
				});
				res.setHeader("Content-Type", "text/html");
				res.send(html);
				return;
			},
		);
	}
}

export async function reloadPages() {
	await mountPages();
}

mountPages();

app.get("/api/layout-modules", ...createMiddleware(layoutModulesRouter.get));

app.post("/api/layout-modules/:elementId", ...createMiddleware(layoutModulesRouter.action));

app.get("/api/layout-modules/:elementId", ...createMiddleware(layoutModulesRouter.render));

app.post("/api/pages", ...createMiddleware(pagesRouter.create));

app.get("/api/pages", ...createMiddleware(pagesRouter.get));

app.put("/api/pages/:id", ...createMiddleware(pagesRouter.update));

app.delete("/api/pages/:id", ...createMiddleware(pagesRouter.delete));

app.post("/api/layouts", ...createMiddleware(layoutsRouter.create));

app.get("/api/layouts", ...createMiddleware(layoutsRouter.get));

app.put("/api/layouts/:id", ...createMiddleware(layoutsRouter.update));

app.delete("/api/layouts/:id", ...createMiddleware(layoutsRouter.delete));

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
