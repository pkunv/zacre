import { db } from "@/lib/server/db";

export async function deletePage(id: string) {
	const page = await db.page.findUnique({
		where: { id },
	});
	if (!page) {
		throw new Error("Page not found", { cause: { statusCode: 404 } });
	}
	if (page.isLocked) {
		throw new Error("Cannot delete a locked page", { cause: { statusCode: 400 } });
	}
	await db.page.delete({ where: { id } });
}
