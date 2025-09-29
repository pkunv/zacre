import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
// If your Prisma file is located elsewhere, you can change the path
import { PrismaClient } from "~/generated/prisma/client";

const prisma = new PrismaClient();
export const auth = betterAuth({
	advanced: {
		cookiePrefix: "zacre",
	},
	plugins: [admin()],
	emailAndPassword: {
		enabled: true,
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql", // or "mysql", "postgresql", ...etc
	}),
});

export type Session = typeof auth.$Infer.Session;
