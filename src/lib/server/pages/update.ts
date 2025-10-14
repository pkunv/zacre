import { db } from "@/lib/server/db";
import { Feature } from "~/generated/prisma/client";

type UpdatePageParams = {
	id: string;
	title?: string;
	description?: string;
	url?: string;
	layoutId?: string;
	isActive?: boolean;
	assignedFeature?: Feature;
	role?: "admin" | "user" | null;
	userId: string;
};

export async function updatePage(params: UpdatePageParams) {
	const { id, title, description, url, layoutId, isActive, assignedFeature, role, userId } = params;
	const page = await db.page.findUnique({
		where: { id: params.id },
	});
	if (!page) {
		throw new Error("Page not found", { cause: { statusCode: 404 } });
	}
	if (url) {
		if (!url.startsWith("/")) {
			throw new Error("URL must start with /", { cause: { statusCode: 400 } });
		}
		const urlTaken = await db.page.findUnique({
			where: { url: url },
		});
		if (urlTaken) {
			throw new Error("URL is already taken by another page", { cause: { statusCode: 400 } });
		}
	}

	await db.page.update({
		where: { id },
		data: {
			title,
			description,
			url,
			layoutId,
			isActive,
			role,
			assignedFeature: assignedFeature as Feature | null,
			updatedById: userId,
		},
	});
}
