import { createLayout } from "@/lib/server/layouts/create";
import { deleteLayout } from "@/lib/server/layouts/delete";
import { getLayouts } from "@/lib/server/layouts/get";
import { updateLayout } from "@/lib/server/layouts/update";
import { createRoute } from "@/lib/server/typed-router";
import { tryCatch } from "@/lib/server/utils";
import { z } from "zod/v3";

export const layoutsRouter = {
	create: createRoute({
		schema: z.object({
			body: z.object({
				title: z.string(),
				description: z.string().optional(),
				isActive: z.boolean(),
				modules: z.array(
					z.object({
						id: z.string(),
						x: z.number(),
						y: z.number(),
						parameters: z.array(
							z.object({
								key: z.string(),
								value: z.string().optional(),
							}),
						),
					}),
				),
			}),
		}),
		role: "admin",
		handler: async (req, res) => {
			const { data, error } = await tryCatch(
				createLayout({
					title: req.data.body.title,
					description: req.data.body.description,
					isActive: req.data.body.isActive,
					modules: req.data.body.modules,
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
				res.status(500).json({ status: "error", message: "Failed to create layout" });
				return;
			}

			res.status(201).json({ status: "success", item: data });
			return;
		},
	}),
	get: createRoute({
		schema: z.object({
			query: z.object({
				title: z.string().optional(),
				description: z.string().optional(),
				isActive: z.coerce.boolean().optional(),
				id: z.string().optional(),
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
					["createdAt", "updatedAt", "title"].includes(field) &&
					["asc", "desc"].includes(direction)
				) {
					orderBy = { [field]: direction as "asc" | "desc" };
				}
			}

			const { data, error } = await tryCatch(
				getLayouts({
					title: req.data.query.title,
					description: req.data.query.description,
					isActive: req.data.query.isActive,
					id: req.data.query.id,
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
				isActive: z.boolean().optional(),
				modules: z.array(
					z.object({
						id: z.string(),
						x: z.number(),
						y: z.number(),
						parameters: z.array(
							z.object({
								key: z.string(),
								value: z.string().optional(),
							}),
						),
					}),
				),
			}),
		}),
		role: "admin",
		handler: async (req, res) => {
			const { data, error } = await tryCatch(
				updateLayout({
					id: req.data.params.id,
					title: req.data.body.title,
					description: req.data.body.description,
					isActive: req.data.body.isActive,
					modules: req.data.body.modules,
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

			res.json({ status: "success", message: "Layout updated successfully" });
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
			const { data, error } = await tryCatch(deleteLayout(req.data.params.id));

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

			res.json({ status: "success", message: "Layout deleted successfully" });
			return;
		},
	}),
};
