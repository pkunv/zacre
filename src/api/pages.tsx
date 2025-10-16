import { reloadPages } from "@/index";
import { createPage } from "@/lib/server/pages/create";
import { deletePage } from "@/lib/server/pages/delete";
import { getPages } from "@/lib/server/pages/get";
import { updatePage } from "@/lib/server/pages/update";
import { createRoute } from "@/lib/server/typed-router";
import { tryCatch } from "@/lib/server/utils";
import { z } from "zod/v3";
import { Feature } from "~/generated/prisma/client";

export const pagesRouter = {
	create: createRoute({
		schema: z.object({
			body: z.object({
				title: z.string(),
				description: z.string(),
				url: z.string(),
				layoutId: z.string(),
				isLocked: z.boolean().optional(),
				assignedFeature: z.nativeEnum(Feature).optional(),
				role: z.enum(["admin", "user"]).nullable().optional(),
			}),
		}),
		role: "admin",
		handler: async (req, res) => {
			console.log(req.data);
			const { data, error } = await tryCatch(
				createPage({
					title: req.data.body.title,
					description: req.data.body.description,
					url: req.data.body.url,
					layoutId: req.data.body.layoutId,
					// since this route is matched against admin, we can safely assume the user is authenticated
					userId: req.auth!.user.id,
					isLocked: req.data.body.isLocked || false,
					assignedFeature: req.data.body.assignedFeature,
					role: req.data.body.role,
				}),
			);

			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}

			if (data === null) {
				res.status(500).json({ status: "error", message: "Failed to create page" });
				return;
			}

			// Reload pages to update the server's page cache
			await reloadPages();

			res.status(201).json({ status: "success", item: data });
			return;
		},
	}),
	get: createRoute({
		schema: z.object({
			query: z.object({
				url: z.string().optional(),
				id: z.string().optional(),
				name: z.string().optional(),
				layoutId: z.string().optional(),
				createdById: z.string().optional(),
				updatedById: z.string().optional(),
				description: z.string().optional(),
				isActive: z.coerce.boolean().optional(),
				isLocked: z.coerce.boolean().optional(),
				assignedFeature: z.nativeEnum(Feature).optional(),
				role: z.string().optional(),
				page: z.coerce.number().optional(),
				limit: z.coerce.number().optional(),
				orderBy: z.string().optional(),
			}),
		}),
		role: "admin",
		handler: async (req, res) => {
			// Parse orderBy if provided (format: "field:direction")
			let orderBy;
			if (req.data.query.orderBy) {
				const [field, direction] = req.data.query.orderBy.split(":");
				if (
					field &&
					direction &&
					["createdAt", "updatedAt", "title", "url", "layoutId"].includes(field) &&
					["asc", "desc"].includes(direction)
				) {
					orderBy = { [field]: direction as "asc" | "desc" };
				}
			}

			const { data, error } = await tryCatch(
				getPages({
					url: req.data.query.url,
					id: req.data.query.id,
					name: req.data.query.name,
					layoutId: req.data.query.layoutId,
					createdById: req.data.query.createdById,
					updatedById: req.data.query.updatedById,
					description: req.data.query.description,
					isActive: req.data.query.isActive,
					isLocked: req.data.query.isLocked,
					assignedFeature: req.data.query.assignedFeature,
					role: req.data.query.role,
					page: req.data.query.page,
					limit: req.data.query.limit,
					orderBy,
				}),
			);

			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}

			res.json({ status: "success", items: data });
			return;
		},
	}),
	update: createRoute({
		schema: z.object({
			params: z.object({
				id: z.string(),
			}),
			body: z.object({
				title: z.string().optional(),
				description: z.string().optional(),
				url: z.string().optional(),
				layoutId: z.string().optional(),
				isActive: z.boolean().optional(),
				assignedFeature: z.nativeEnum(Feature).optional(),
				role: z.enum(["admin", "user"]).nullable().optional(),
			}),
		}),
		role: "admin",
		handler: async (req, res) => {
			const { data, error } = await tryCatch(
				updatePage({
					id: req.data.params.id,
					title: req.data.body.title,
					description: req.data.body.description,
					url: req.data.body.url,
					layoutId: req.data.body.layoutId,
					isActive: req.data.body.isActive,
					assignedFeature: req.data.body.assignedFeature,
					role: req.data.body.role,
					userId: req.auth!.user.id,
				}),
			);

			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}

			// Reload pages to update the server's page cache
			await reloadPages();

			res.json({ status: "success", message: "Page updated successfully" });
			return;
		},
	}),
	delete: createRoute({
		schema: z.object({
			params: z.object({
				id: z.string(),
			}),
		}),
		role: "admin",
		handler: async (req, res) => {
			const { data, error } = await tryCatch(deletePage(req.data.params.id));

			if (error) {
				res
					.status(
						(typeof error.cause === "object" && error.cause && "statusCode" in error.cause
							? (error.cause as { statusCode?: number }).statusCode
							: undefined) || 500,
					)
					.json({ status: "error", message: error.message });
				return;
			}

			// Reload pages to update the server's page cache
			await reloadPages();

			res.json({ status: "success", message: "Page deleted successfully" });
			return;
		},
	}),
};
