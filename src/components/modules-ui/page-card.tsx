import { Button } from "@/components/modules-ui/button";
import { H2, Muted, P, SmallMuted } from "@/components/modules-ui/typography";
import { Page } from "@/lib/server/pages/get";
import { capitalize, formatDate } from "@/lib/server/utils";

export function PageCard({ page }: { page: Page }) {
	return (
		<div class="flex flex-col gap-4 card bg-base-100 shadow-sm w-full max-w-3xl">
			<div class="card-body">
				<a href={page.url} target="_blank" class="flex flex-row gap-4 items-center link-hover">
					<H2 className="card-title">{page.title}</H2>
					<i data-lucide="external-link" class="w-3 h-3"></i>
				</a>
				<div class="flex flex-row gap-4 items-center">
					<div class="badge badge-primary">{page.url}</div>
					{page.assignedFeature && (
						<div class="badge badge-ghost">Website feature: {capitalize(page.assignedFeature)}</div>
					)}
					{page.role && <div class="badge badge-secondary">Role: {capitalize(page.role)}</div>}
					{page.isLocked && (
						<div class="badge badge-warning">
							<i data-lucide="lock" class="w-3 h-3"></i>Locked
						</div>
					)}
				</div>
				<SmallMuted>Layout: {page.layout.title}</SmallMuted>
				<P>{page.description}</P>
				<Muted>Created: {formatDate(page.createdAt)}</Muted>
				<Muted>Updated: {formatDate(page.updatedAt)}</Muted>
				<div class="card-actions justify-end">
					<Button asLink href={`/admin/pages/${page.id}`} iconName="pencil">
						Edit
					</Button>
				</div>
			</div>
		</div>
	);
}
