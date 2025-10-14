import { db } from "@/lib/server/db";
import { Feature } from "~/generated/prisma/client";

export type CreatePageParams = {
	title: string;
	description: string;
	url: string;
	layoutId: string;
	userId: string;
	isLocked: boolean;
	assignedFeature?: Feature;
	role?: "admin" | "user" | null;
};

export async function createPage(params: CreatePageParams) {
	const layout = await db.layout.findUnique({
		where: {
			id: params.layoutId,
		},
	});
	if (!layout) {
		throw new Error("Layout not found");
	}
	const existingPage = await db.page.findUnique({
		where: {
			url: params.url,
		},
	});
	if (existingPage) {
		return existingPage;
	}
	const page = await db.page.create({
		data: {
			title: params.title,
			description: params.description,
			url: params.url,
			layoutId: params.layoutId,
			createdById: params.userId,
			updatedById: params.userId,
			role: params.role || undefined,
			isLocked: params.isLocked,
			assignedFeature: params.assignedFeature || undefined,
		},
	});
	return page;
}
