import { db } from "@/lib/server/db";
import { layoutIncludes } from "@/lib/server/layouts/get";

export async function deleteLayout(id: string) {
	const layout = await db.layout.findUnique({
		include: layoutIncludes,
		where: { id },
	});
	if (!layout) {
		throw new Error("Layout not found", { cause: { statusCode: 404 } });
	}
	if (layout.pages && layout.pages.length > 0) {
		throw new Error("Layout has pages, cannot delete", { cause: { statusCode: 400 } });
	}
	await db.layout.delete({ where: { id } });
}
