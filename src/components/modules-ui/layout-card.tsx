import { H2, P } from "@/components/modules-ui/typography";
import { Layout } from "@/lib/server/layouts/get";

export function LayoutCard({ layout }: { layout: Layout }) {
	return (
		<div class="flex flex-col gap-4 card bg-base-100 shadow-sm w-full max-w-3xl">
			<div class="card-body">
				<H2 className="card-title">{layout.title}</H2>
				<div class="flex flex-row gap-4">
					{layout.pages.map((page) => (
						<div class="badge badge-ghost">{page.url}</div>
					))}
				</div>
				<h2>{layout.title}</h2>
				<P>{layout.description}</P>
				<small>{layout.createdAt.toLocaleDateString()}</small>
				<div class="card-actions justify-end">
					<a className="btn btn-primary btn-edit" href={`/admin/layouts/${layout.id}`}>
						<i class="w-4 h-4" data-lucide="pencil"></i>Edit
					</a>
				</div>
			</div>
		</div>
	);
}
