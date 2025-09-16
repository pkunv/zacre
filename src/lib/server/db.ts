import { Return } from "@prisma/client/runtime/library";
import { PrismaClient } from "~/generated/prisma/client";

import { env } from "@/lib/server/env";

const createPrismaClient = () => {
	return new PrismaClient({
		log: ["error"],
	});
};

const globalForPrisma = globalThis as unknown as {
	prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export type PrismaClientType = Return<typeof createPrismaClient>;

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
