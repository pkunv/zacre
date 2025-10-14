import { auth } from "@/auth";
import { db } from "@/lib/server/db";
import { createLayout } from "@/lib/server/layouts/create";
import { logMessage } from "@/lib/server/log";
import { createPage } from "@/lib/server/pages/create";
import { createConfigParameter, initializeParameters } from "@/lib/server/parameter";
import { serverModules } from "@/modules/server";
import { Feature, Module, ParameterTypeEnum } from "~/generated/prisma/client";

async function main() {
	logMessage({ functionName: "seed", message: "Starting seed...", appendToLogFile: true });
	const startTime = performance.now();

	const existingSystemUser = await db.user.findUnique({
		where: {
			email: "admin@zacre.local",
		},
	});

	let systemUserId: string | null = null;
	if (existingSystemUser) {
		systemUserId = existingSystemUser.id;
	} else {
		const systemUser = await auth.api.createUser({
			body: {
				email: "admin@zacre.local", // required
				password: "admin", // required
				name: "Admin", // required
				role: "admin",
			},
		});
		systemUserId = systemUser.user.id;
	}

	await initializeParameters();

	await createConfigParameter("website.name", "Zacre");
	await createConfigParameter(
		"website.description",
		"Modular website builder for personal websites, small businesses and more.",
	);
	await createConfigParameter(
		"website.keywords",
		"zacre, website builder, modular website, personal website, small business website, node.js, kunv, wordpress",
	);
	await createConfigParameter("website.author", "Piotr Kuncy (KUNV)");
	await createConfigParameter("website.logo", "/default-logo.webp");
	await createConfigParameter("website.favicon", "/favicon.ico");
	await createConfigParameter("website.theme", "emerald");

	for (const module of serverModules) {
		await db.module.upsert({
			where: {
				shortName: module.shortName,
			},
			create: {
				shortName: module.shortName,
				name: module.name,
				description: module.description,
				createdAt: module.createdAt,
			},
			update: {
				name: module.name,
				description: module.description,
				createdAt: module.createdAt,
			},
		});

		for (const parameter of module.parameters || []) {
			await db.parameterType.upsert({
				where: {
					key: `${module.shortName}.${parameter.key}`,
				},
				create: {
					key: `${module.shortName}.${parameter.key}`,
					type: (parameter as any).type ?? ParameterTypeEnum.STRING,
					isRequired: (parameter as any).isRequired ?? false,
					isSelect: (parameter as any).isSelect ?? false,
					selectValues: (parameter as any).selectValues ?? null,
					schema: (parameter as any).schema ?? null,
				},
				update: {},
			});
		}
	}

	const modules = await db.module.findMany().then((modules) =>
		modules.reduce(
			(acc, module) => {
				acc[module.shortName] = module;
				return acc;
			},
			{} as Record<string, Module>,
		),
	);

	const homeLayout = await createLayout({
		title: "Home",
		description: "Home",
		isActive: true,
		modules: [
			{
				id: modules.navbar.id,
				x: 0,
				y: 0,
				parameters: [{ key: "titleImage", value: "/default-logo.webp" }],
			},
			{
				id: modules.hero.id,
				x: 0,
				y: 1,
				parameters: [
					{
						key: "title",
						value: "Lightweight and fast website builder. Small Wordpress alternative.",
					},
					{ key: "description", value: "Built by Kunv" },
					{ key: "primaryButtonText", value: "Deploy now" },
					{ key: "primaryButtonLink", value: "/deploy" },
					{ key: "secondaryButtonText", value: "Learn more" },
					{ key: "secondaryButtonLink", value: "/features" },
					{ key: "image", value: "/logo-sm.webp" },
				],
			},
			{
				id: modules.footer.id,
				x: 0,
				y: 2,
				parameters: [
					{ key: "copyrightText", value: "Copyright 2025 Zacre. All rights reserved." },
					{ key: "linkedinLink", value: "https://www.linkedin.com/in/piotr-kuncy-1a4618237/" },
					{ key: "githubLink", value: "https://github.com/pkunv/zacre" },
					{ key: "emailAddress", value: "kuncypiotr@gmail.com" },
				],
			},
		],
	});

	const signInLayout = await createLayout({
		title: "Sign In",
		description: "Sign In",
		isActive: true,
		modules: [
			{
				id: modules.signIn.id,
				x: 0,
				y: 0,
				parameters: [{ key: "isSignUpEnabled", value: "false" }],
			},
		],
	});

	const adminLayoutLayouts = await createLayout({
		title: "Admin",
		description: "Admin",
		isActive: true,
		modules: [
			{ id: modules.adminSidebar.id, x: 0, y: 0, parameters: [] },
			{ id: modules.adminLayouts.id, x: 1, y: 0, parameters: [] },
		],
	});

	const adminLayoutForm = await createLayout({
		title: "Admin layout form",
		description: "Admin layout form",
		isActive: true,
		modules: [
			{ id: modules.adminSidebar.id, x: 0, y: 0, parameters: [] },
			{ id: modules.layoutForm.id, x: 1, y: 0, parameters: [] },
		],
	});

	const adminPagesLayout = await createLayout({
		title: "Admin pages",
		description: "Admin pages",
		isActive: true,
		modules: [
			{ id: modules.adminSidebar.id, x: 0, y: 0, parameters: [] },
			{ id: modules.adminPages.id, x: 1, y: 0, parameters: [] },
		],
	});

	await createPage({
		title: "Home",
		description: "Home",
		url: "/",
		layoutId: homeLayout.id,
		userId: systemUserId,
		isLocked: true,
	});

	await createPage({
		title: "Sign In",
		description: "Sign In",
		url: "/sign-in",
		layoutId: signInLayout.id,
		userId: systemUserId,
		isLocked: false,
		assignedFeature: Feature.AUTH,
	});

	await createPage({
		title: "Admin",
		description: "Admin panel to manage your website",
		url: "/admin",
		role: "admin",
		layoutId: adminLayoutLayouts.id,
		userId: systemUserId,
		isLocked: true,
		assignedFeature: Feature.ADMIN,
	});

	await createPage({
		title: "Layouts",
		description: "List of layouts on your website to use in pages",
		url: "/admin/layouts",
		role: "admin",
		layoutId: adminLayoutLayouts.id,
		userId: systemUserId,
		isLocked: true,
		assignedFeature: Feature.ADMIN,
	});

	await createPage({
		title: "Edit layout",
		description: "Edit a layout in admin panel",
		url: "/admin/layouts/:layoutId",
		role: "admin",
		layoutId: adminLayoutForm.id,
		userId: systemUserId,
		isLocked: true,
		assignedFeature: Feature.ADMIN,
	});

	await createPage({
		title: "Create layout",
		description: "Create a new layout in admin panel",
		url: "/admin/layouts/new",
		role: "admin",
		layoutId: adminLayoutForm.id,
		userId: systemUserId,
		isLocked: true,
		assignedFeature: Feature.ADMIN,
	});

	await createPage({
		title: "Pages",
		description: "List of pages on your website",
		url: "/admin/pages",
		role: "admin",
		layoutId: adminPagesLayout.id,
		userId: systemUserId,
		isLocked: true,
		assignedFeature: Feature.ADMIN,
	});

	logMessage({
		functionName: "seed",
		message: `Seed completed in ${performance.now() - startTime}ms`,
		appendToLogFile: true,
	});

	return;
}

main()
	.then(async () => {
		await db.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await db.$disconnect();
		process.exit(1);
	});
