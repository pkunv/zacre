import { Button } from "@/components/modules-ui/button";
import { H2, Muted, P } from "@/components/modules-ui/typography";
import { Layout } from "@/lib/server/layouts/get";
import { formatDate } from "@/lib/server/utils";
import { JSX } from "preact/jsx-runtime";

export function LayoutCard({
	layout,
	children,
	className = "",
}: {
	layout: Layout;
	children?: JSX.Element | JSX.Element[] | string;
	className?: string;
}) {
	return (
		<div
			class={`flex flex-col gap-4 card bg-base-100 shadow-sm w-full max-w-3xl ${className}`}
			data-layout-id={layout.id}
			data-layout-title={layout.title}
		>
			<div class="card-body">
				<H2 className="card-title">{layout.title}</H2>
				<div class="flex flex-row gap-4">
					{layout.pages.map((page) => (
						<div class="badge badge-ghost">{page.url}</div>
					))}
				</div>
				<P>{layout.description}</P>
				<Muted>Created: {formatDate(layout.createdAt)}</Muted>
				<Muted>Updated: {formatDate(layout.updatedAt)}</Muted>
				<div class="card-actions justify-end">
					{!children ? (
						<Button asLink href={`/admin/layouts/${layout.id}`} iconName="pencil">
							Edit
						</Button>
					) : (
						children
					)}
				</div>
			</div>
		</div>
	);
}
