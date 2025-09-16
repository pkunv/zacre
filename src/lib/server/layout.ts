import { Prisma } from "~/generated/prisma/client";

export const layoutModuleIncludes = {
	module: true,
	parameters: true,
} satisfies Prisma.LayoutModuleInclude;

export type LayoutElement<T> = Prisma.LayoutModuleGetPayload<{
	include: typeof layoutModuleIncludes;
}> & {
	parameters: Record<T extends { key: string } ? T["key"] : never, string | undefined>;
};
