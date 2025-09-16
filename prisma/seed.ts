import { db } from "@/lib/server/db";
import { logMessage } from "@/lib/server/log";
import { createParameter, initializeParameters } from "@/lib/server/parameter";
import { serverModules } from "@/modules/server";

async function main() {
	logMessage({ functionName: "seed", message: "Starting seed...", appendToLogFile: true });
	const startTime = performance.now();

	// Create a system user for seeding
	const systemUser = await db.user.upsert({
		where: {
			email: "system@zacre.local",
		},
		create: {
			id: "system-user",
			name: "System User",
			email: "system@zacre.local",
			emailVerified: true,
		},
		update: {},
	});

	await initializeParameters();

	await createParameter("website.name", "Zacre");
	await createParameter(
		"website.description",
		"Modular website builder for personal websites, small businesses and more.",
	);
	await createParameter(
		"website.keywords",
		"zacre, website builder, modular website, personal website, small business website, node.js, kunv, wordpress",
	);
	await createParameter("website.author", "Piotr Kuncy (KUNV)");
	await createParameter("website.logo", "/default-logo.webp");
	await createParameter("website.favicon", "/favicon.ico");
	await createParameter("website.theme", "emerald");

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

		for (const parameter of module.parameters) {
			await db.parameterType.upsert({
				where: {
					key: parameter.key,
				},
				create: {
					key: parameter.key,
				},
				update: {},
			});
		}
	}

	const heroModule = await db.module.findFirst({
		where: {
			shortName: "hero",
		},
	});

	const navbarModule = await db.module.findFirst({
		where: {
			shortName: "navbar",
		},
	});

	const footerModule = await db.module.findFirst({
		where: {
			shortName: "footer",
		},
	});

	const homeLayout = await db.layout.upsert({
		where: {
			id: "home",
		},
		create: {
			id: "home",
			title: "Home",
			description: "Home",
			isActive: true,
			isDeleted: false,
			isPublic: false,
			isPublished: false,
		},
		update: {},
	});

	await db.layoutModule.deleteMany({
		where: {
			layoutId: homeLayout.id,
		},
	});

	await db.layoutModule.create({
		data: {
			layoutId: homeLayout.id,
			moduleId: heroModule!.id,
			parameters: {
				createMany: {
					data: [
						{
							key: "title",
							value: "Lightweight and fast website builder. Small Wordpress alternative.",
						},
						{
							key: "description",
							value: "Built by Kunv",
						},
						{
							key: "primaryButtonText",
							value: "Deploy now",
						},
						{
							key: "primaryButtonLink",
							value: "/deploy",
						},
						{
							key: "secondaryButtonText",
							value: "Learn more",
						},
						{
							key: "secondaryButtonLink",
							value: "/features",
						},
						{
							key: "image",
							value: "/logo-sm.webp",
						},
					],
				},
			},
		},
	});

	await db.layoutModule.create({
		data: {
			layoutId: homeLayout.id,
			moduleId: navbarModule!.id,
			parameters: {
				createMany: {
					data: [
						{
							key: "titleImage",
							value: "/default-logo.webp",
						},
					],
				},
			},
		},
	});

	await db.layoutModule.create({
		data: {
			layoutId: homeLayout.id,
			moduleId: footerModule!.id,
			parameters: {
				createMany: {
					data: [
						{
							key: "copyrightText",
							value: "Copyright 2025 Zacre. All rights reserved.",
						},
						{
							key: "linkedinLink",
							value: "https://www.linkedin.com/in/piotr-kuncy-1a4618237/",
						},
						{
							key: "githubLink",
							value: "https://github.com/pkunv/zacre",
						},
						{
							key: "emailAddress",
							value: "kuncypiotr@gmail.com",
						},
					],
				},
			},
		},
	});

	await db.page.upsert({
		where: {
			url: "/",
		},
		create: {
			url: "/",
			title: "Home",
			description: "Home",
			layoutId: homeLayout.id,
			createdById: systemUser.id,
			updatedById: systemUser.id,
		},
		update: {},
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
